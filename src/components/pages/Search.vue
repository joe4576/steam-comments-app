<template>
  <div>
    <!-- Header section-->
    <v-container class="main-container">
      <v-container>
        <v-row>
          <v-col cols="12" md="6">
            <search-card
              v-model="userInput"
              @search="getComments()"
              @clear-error-messages="clearErrorMessages()"
            />
          </v-col>
          <v-col cols="12" md="6">
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
      </v-container>

      <!-- Error messages -->
      <v-container>
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

      <!-- Number of comments found -->
      <v-container v-if="allComments">
        <v-row>
          <v-col>
            Found <b>{{ numberOfCommentsFound }}</b> comments.
          </v-col>
        </v-row>
      </v-container>

      <!-- Comment section-->
      <v-container v-if="commentsToDisplay" class="mx-auto">
        <v-row
          v-for="(comment, index) in commentsToDisplay"
          :key="index"
          :style="{
            'background-color': rowColor(index),
          }"
          dense
          class="pa-2"
          align="center"
        >
          <!-- Avatar -->
          <v-col cols="auto" class="ml-1">
            <v-row>
              <v-col>
                <a :href="comment.authorUrl" target="_blank">
                  <img
                    :src="comment.avatarSrc"
                    style="margin-top: 5px"
                    alt="Player avatar"
                  />
                </a>
              </v-col>
            </v-row>
          </v-col>
          <!-- Name -->
          <v-col cols="8" sm="4" md="3" lg="2" class="ml-2">
            <v-row>
              <v-col sm="auto">
                <p style="overflow-x: scroll" class="my-auto">
                  {{ comment.personaName }}
                </p>
              </v-col>
            </v-row>
          </v-col>
          <!-- Comment -->
          <v-col cols="12" sm="6" md="6" lg="7" style="overflow-x: overlay">
            {{ comment.authorComment }}
          </v-col>
        </v-row>
      </v-container>
    </v-container>

    <!-- Dialogs -->
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
import errorStore from "@/store/errorStore";
import FilterExpansionCard, {
  FilterExpansionCardInterface,
} from "@/components/FilterExpansionCard.vue";
import {
  populateArrayWithValuesFromMap,
  pushKeyToArrayMap,
} from "@/utils/maps";
import { useRouter } from "@/router/router";
import isEqual from "lodash.isequal";
import { AuthorComment } from "@/types/types";
import SearchCard from "@/components/SearchCard.vue";

interface QueryParameters {
  url?: string;
  name?: string;
  comment?: string;
}

export default defineComponent({
  name: "Search",
  components: {
    FilterExpansionCard,
    SearchCard,
  },
  setup() {
    const userInput = ref<string>("");
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
      filterBySteamUrl,
      filterBySteamName,
      filterByComment,

      rowColor: (rowIndex: number) => {
        return rowIndex % 2 !== 0 ? "#eeeeee" : "#b0ceff";
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
.main-container {
  max-width: 1100px;
}
</style>
