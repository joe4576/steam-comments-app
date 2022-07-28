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
              :disabled="!allComments"
              :default-filter-values="defaultQueryParams"
              @filter="filterCommentsToDisplay"
              @reset="reset()"
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
  QueryParameters,
} from "@/components/FilterExpansionCard.vue";
import { useRouter } from "@/router/router";
import isEqual from "lodash.isequal";
import { AuthorComment } from "@/types/types";
import SearchCard from "@/components/SearchCard.vue";

export default defineComponent({
  name: "Search",
  components: {
    FilterExpansionCard,
    SearchCard,
  },
  setup() {
    const userInput = ref<string>("");
    const allComments = ref<AuthorComment[]>([]);
    const commentsToDisplay = ref<AuthorComment[] | null>(null);
    const loading = ref(false);
    const errorMessages = ref<string[]>([]);

    const defaultQueryParams = ref<QueryParameters | null>(null);

    const filterExpansionCard = ref<FilterExpansionCardInterface | null>(null);

    const { router, route } = useRouter();

    const clearErrorMessages = () => {
      errorMessages.value = [];
    };

    /**
     * Gets all steam comments and clears any previous query params
     */
    const getComments = async () => {
      clearErrorMessages();
      filterCommentsToDisplay(undefined, true);
      filterExpansionCard.value?.resetFormValues();

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

      allComments.value =
        (await api.getAllCommentsForUser(filteredInput)) ?? [];

      commentsToDisplay.value = allComments.value;

      loading.value = false;
    };

    const doesStringIncludeTerm = (
      stringToCheck: string,
      searchTerm: string
    ): boolean =>
      stringToCheck.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1;

    /**
     * Filters visible comments based on search terms and updates query params
     * to reflect filter changes
     *
     * @param event Parameters to filter by
     * @param reset If true, all query params except `account` will be cleared.
     * False by default
     */
    const filterCommentsToDisplay = async (
      event?: QueryParameters,
      reset: boolean = false
    ): Promise<void> => {
      let allCommentsClone = [...allComments.value];

      if (event?.url) {
        allCommentsClone = allCommentsClone.filter((c) =>
          doesStringIncludeTerm(c.authorUrl, event.url!)
        );
      }
      if (event?.name) {
        allCommentsClone = allCommentsClone.filter((c) =>
          doesStringIncludeTerm(c.personaName, event.name!)
        );
      }
      if (event?.comment) {
        allCommentsClone = allCommentsClone.filter((c) =>
          doesStringIncludeTerm(c.authorComment, event.comment!)
        );
      }

      commentsToDisplay.value = allCommentsClone;

      const routerQueryParamsCopy = Object.assign({}, route.value.query);

      // clear all params except account
      Object.entries(routerQueryParamsCopy).forEach(([key, _]) => {
        if (key !== "account") {
          delete routerQueryParamsCopy[key];
        }
      });

      // reassign query params with new values from event
      if (event && !reset) {
        Object.entries(event).forEach(([key, value]) => {
          if (value) {
            routerQueryParamsCopy[key] = value;
          }
        });
      }

      if (!isEqual(routerQueryParamsCopy, route.value.query)) {
        await router.replace({ query: routerQueryParamsCopy });
      }
    };

    onMounted(async () => {
      if (route.value.query.account) {
        userInput.value = route.value.query.account.toString();
        await getComments();
      }

      const url = route.value.query.url?.toString();
      const comment = route.value.query.comment?.toString();
      const name = route.value.query.name?.toString();

      if (url || comment || name) {
        defaultQueryParams.value = {
          url,
          comment,
          name,
        };
        await filterCommentsToDisplay(defaultQueryParams.value);
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

      rowColor: (rowIndex: number) =>
        rowIndex % 2 !== 0 ? "#eeeeee" : "#b0ceff",

      // reset all comments and clear filter query params
      reset: async () => {
        commentsToDisplay.value = allComments.value;
        filterCommentsToDisplay(undefined, true);
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
      filterCommentsToDisplay,
      defaultQueryParams,
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
