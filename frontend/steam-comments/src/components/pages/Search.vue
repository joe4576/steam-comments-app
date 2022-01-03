<template>
  <div>
    <v-container>
      <v-row>
        <v-col cols="6">
          <v-card>
            <v-container>
              <v-row class="mx-3">
                <v-col>
                  <v-form @submit.prevent="getComments()">
                    <v-row>
                      <v-col cols="12">
                        <v-text-field
                          v-model="userInput"
                          clearable
                          autofocus
                          @click:clear="clearErrorMessages()"
                        />
                      </v-col>
                    </v-row>
                    <v-row>
                      <v-col cols="auto">
                        <v-btn @click="getComments()" block>
                          Get comments
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-form>
                </v-col>
              </v-row>
            </v-container>
          </v-card>
        </v-col>
        <v-col cols="6">
          <filter-expansion-card
            title="Filter Results"
            ref="filterExpansionCard"
            @steamUrlResult="filterBySteamUrl"
            @steamNameResult="filterBySteamName"
            @commentResult="filterByComment"
            @reset="reset()"
            :disabled="!allComments"
          />
        </v-col>
      </v-row>
      <v-row v-if="errorMessages">
        <ul v-for="(error, index) in errorMessages" :key="index">
          <li class="error-msg">{{ error }}</li>
        </ul>
      </v-row>
      <v-row v-if="apiErrorMessage">
        <ul>
          <li class="error-msg">{{ apiErrorMessage }}</li>
        </ul>
      </v-row>
    </v-container>
    <v-container v-if="allComments">
      <v-row>
        <v-col>
          Found <b>{{ numberOfCommentsFound }}</b> comments.
        </v-col>
      </v-row>
    </v-container>
    <v-container v-if="commentsToDisplay">
      <v-row
        v-for="(comment, index) in commentsToDisplay"
        :key="index"
        :style="{
          'background-color': rowColor(index),
          'overflow-y': 'scroll',
        }"
      >
        <v-col cols="auto">
          <a :href="comment.authorUrl" target="_blank">
            <img :src="comment.avatarSrc" alt="Player avatar" />
          </a>
        </v-col>
        <v-col cols="auto">
          <v-row>
            <v-col cols="12">
              <pre>{{ comment.personaName }}</pre>
            </v-col>
          </v-row>
        </v-col>
        <v-spacer />
        <v-col cols="7">{{ comment.authorComment }}</v-col>
      </v-row>
    </v-container>
    <v-dialog v-model="loading" hide-overlay persistent width="300">
      <v-card color="primary" dark>
        <v-card-text>
          Fetching comments...
          <v-progress-linear indeterminate color="white" class="mb-0" />
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  ref,
} from "@vue/composition-api";
import api from "@/services/api";
import { AuthorComment } from "../../../../../backend/src/types/types";
import errorStore from "../../store/errorStore";
import FilterExpansionCard, {
  FilterExpansionCardInterface,
} from "@/components/FilterExpansionCard.vue";
import {
  populateArrayWithValuesFromMap,
  pushKeyToArrayMap,
} from "@/utils/maps";
import { useRouter } from "@/router/router";
import isEqual from "lodash.isequal";

interface QueryParameters {
  url?: string;
  name?: string;
  comment?: string;
}

export default defineComponent({
  name: "Search",
  components: {
    FilterExpansionCard,
  },
  setup() {
    const userInput = ref<string | null>(null);
    const allComments = ref<AuthorComment[] | null>(null);
    const commentsToDisplay = ref<AuthorComment[] | null>(null);
    const loading = ref(false);
    const errorMessages = ref<string[]>([]);

    const urlCommentMap = new Map<string, AuthorComment[]>();
    const nameCommentMap = new Map<string, AuthorComment[]>();
    const commentMap = new Map<string, AuthorComment[]>();

    const filterExpansionCard = ref<FilterExpansionCardInterface | null>(null);

    const { router, route } = useRouter();

    const clearErrorMessages = () => {
      errorMessages.value = [];
    };

    // Get all comments, with the option of clearing query params. Defaults to false
    // as this method gets called if the page is initially visited with an existing
    // account query param. Query params will be cleared if the reset button is
    // hit manually.
    const getComments = async (clearQueryParams: boolean = false) => {
      clearErrorMessages();
      filterExpansionCard.value?.resetFormValues(clearQueryParams);
      urlCommentMap.clear();
      nameCommentMap.clear();
      commentMap.clear();

      const trimmedInput = userInput.value?.trim() ?? "";
      if (!trimmedInput) {
        errorMessages.value.push("Enter a steam url or steamid64");
        return;
      }

      // add query param if not already there or duplicate
      if (
        !route.value.query.account ||
        route.value.query.account !== trimmedInput.toString()
      ) {
        await router.replace({
          query: { account: trimmedInput },
        });
      }

      /**
       * remove:
       * - https://steamcommunity.com/id/
       * - https://steamcommunity.com/profiles/
       */
      const filteredInput = trimmedInput.replace(
        /(https\:\/\/steamcommunity.com\/id\/|https\:\/\/steamcommunity.com\/profiles\/)/,
        ""
      );

      loading.value = true;
      allComments.value = await api.getAllCommentsForUser(filteredInput);

      commentsToDisplay.value = allComments.value;

      if (allComments.value) {
        allComments.value.forEach((c) => {
          const authorUrl = c.authorUrl.toLowerCase();
          const personaName = c.personaName.toLowerCase();
          const commentContent = c.authorComment.toLowerCase();

          // Map url, persona name and comment content to an array of
          // comment objects they correspond to.
          pushKeyToArrayMap<AuthorComment>(authorUrl, c, urlCommentMap);
          pushKeyToArrayMap<AuthorComment>(personaName, c, nameCommentMap);
          pushKeyToArrayMap<AuthorComment>(commentContent, c, commentMap);
        });
      }

      loading.value = false;
    };

    // Clear and then set query parameters (currently only used for singular
    // filter param, however multiple combinations of parameters could be
    // supported in the future)
    const setQueryParameters = async (parameters: QueryParameters) => {
      await clearAllFilterQueryParametersExceptAccount();
      const params = Object.assign({}, route.value.query);

      // update query parameters with new values
      for (const [key, value] of Object.entries(parameters)) {
        Object.assign(params, { [key]: value });
      }

      if (!isEqual(params, route.value.query)) {
        await router.replace({ query: params });
      }
    };

    const clearAllFilterQueryParametersExceptAccount = async () => {
      const queryCopy = Object.assign({}, route.value.query);
      for (const [key, value] of Object.entries(queryCopy)) {
        if (key !== "account") {
          delete queryCopy[key];
        }
      }
      if (!isEqual(route.value.query, queryCopy)) {
        await router.replace({ query: queryCopy });
      }
    };

    const filterBySteamUrl = async (value: string) => {
      if (allComments.value && value) {
        const commentsByUrl = urlCommentMap.get(value) ?? [];
        commentsToDisplay.value = commentsByUrl;
        await setQueryParameters({ url: value });
      }
    };

    const filterBySteamName = async (value: string) => {
      if (allComments.value && value) {
        commentsToDisplay.value = populateArrayWithValuesFromMap(
          value,
          nameCommentMap
        );
        await setQueryParameters({ name: value });
      }
    };

    const filterByComment = async (value: string) => {
      if (allComments.value && value) {
        commentsToDisplay.value = populateArrayWithValuesFromMap(
          value,
          commentMap
        );
        await setQueryParameters({ comment: value });
      }
    };

    onMounted(async () => {
      if (route.value.query.account) {
        userInput.value = route.value.query.account.toString();
        await getComments();
      }
      if (route.value.query.url) {
        await filterBySteamUrl(route.value.query.url.toString());
      }
      if (route.value.query.name) {
        await filterBySteamName(route.value.query.name.toString());
      }
      if (route.value.query.comment) {
        await filterByComment(route.value.query.comment.toString());
      }
    });

    return {
      getComments,
      userInput,
      allComments,
      loading,
      clearErrorMessages,
      errorMessages,
      commentsToDisplay,
      filterExpansionCard,
      defaultAvatarSrc:
        "https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/avatars/48/4888d158c81bc8f1d7644321d9eb78b0048a9bda_medium.jpg",
      filterBySteamUrl,
      filterBySteamName,
      filterByComment,

      rowColor: (rowIndex: number) => {
        return rowIndex % 2 !== 0 ? "white" : "#b0ceff";
      },

      // reset all comments and clear filter query params
      reset: async () => {
        commentsToDisplay.value = allComments.value;
        await clearAllFilterQueryParametersExceptAccount();
      },

      numberOfCommentsFound: computed(() => {
        if (!commentsToDisplay.value && allComments.value) {
          return allComments.value.length;
        } else if (commentsToDisplay.value) {
          return commentsToDisplay.value.length;
        } else {
          return -1;
        }
      }),
      apiErrorMessage: computed(() => errorStore.apiErrorMessage.value),
    };
  },
});
</script>

<style scoped>
.error-msg {
  color: red;
}
</style>
