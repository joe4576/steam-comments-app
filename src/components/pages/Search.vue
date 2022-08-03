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
              :default-expanded="expandFilterCardByDefault"
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
      <v-container v-if="commentsToDisplay.length && !loading">
        <v-row>
          <v-col>
            Found <b>{{ commentsToDisplay.length }}</b> comments.
          </v-col>
        </v-row>
      </v-container>

      <!-- Comments table -->
      <data-table
        :items="commentsToDisplay"
        :headers="tableHeaders"
        :loading="loading"
        :disable-sort="$vuetify.breakpoint.xsOnly"
        :mobile-breakpoint="-1"
      >
        <template #avatarSrc="{ item }">
          <a :href="item.authorUrl" target="_blank">
            <v-img
              :src="item.avatarSrc"
              max-height="30px"
              max-width="30px"
              alt="Player avatar"
            />
          </a>
        </template>
        <template #personaName="{ item }">
          <p class="my-auto" style="overflow-wrap: break-word">
            {{ item.personaName }}
          </p>
        </template>
      </data-table>
    </v-container>
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
import DataTable, { TypedDataTableHeader } from "@/components/DataTable.vue";

export default defineComponent({
  name: "Search",
  components: {
    FilterExpansionCard,
    SearchCard,
    DataTable,
  },
  setup() {
    const userInput = ref<string>("");
    const allComments = ref<AuthorComment[]>([]);
    const commentsToDisplay = ref<AuthorComment[]>([]);
    const loading = ref(false);
    const errorMessages = ref<string[]>([]);

    const defaultQueryParams = ref<QueryParameters | null>(null);
    const expandFilterCardByDefault = ref(false);

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
        expandFilterCardByDefault.value = true;
      }
    });

    const tableHeaders: TypedDataTableHeader<AuthorComment>[] = [
      {
        text: "Avatar",
        value: "avatarSrc",
        width: "10%",
      },
      {
        text: "Name",
        value: "personaName",
        width: "25%",
      },
      {
        text: "Comment",
        value: "authorComment",
        width: "50%",
      },
    ];

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

      apiErrorMessage: computed(() => errorStore.apiErrorMessage.value),
      filterCommentsToDisplay,
      defaultQueryParams,
      expandFilterCardByDefault,
      tableHeaders,
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
