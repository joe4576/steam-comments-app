<template>
  <v-app>
    <v-app-bar app color="primary" dark> Steam Comments Searcher </v-app-bar>
    <v-main>
      <v-container>
        <v-row>
          <v-col>
            <v-form @submit.prevent="getComments()">
              <v-row justify="center">
                <v-col class="mx-auto" cols="6">
                  <v-text-field
                    v-model="userInput"
                    clearable
                    autofocus
                    @click:clear="clearErrorMessages()"
                  />
                </v-col>
              </v-row>
              <v-row justify="center">
                <v-col class="mx-auto" cols="4">
                  <v-btn @click="getComments()" block> Get comments </v-btn>
                </v-col>
              </v-row>
            </v-form>
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
      <v-container v-if="comments">
        <v-row>
          <v-col>
            Found <b>{{ comments.length }}</b> comments.
          </v-col>
        </v-row>
        <v-row
          v-for="(comment, index) in comments"
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
    </v-main>
  </v-app>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from "@vue/composition-api";
import api from "@/services/api";
import { AuthorComment } from "../../../backend/src/types/types";
import errorStore from "./store/errorStore";

export default defineComponent({
  name: "App",
  setup() {
    const userInput = ref<string | null>(null);
    const comments = ref<AuthorComment[] | null>(null);
    const loading = ref(false);
    const errorMessages = ref<string[]>([]);

    const clearErrorMessages = () => {
      errorMessages.value = [];
    };

    const getComments = async () => {
      clearErrorMessages();
      const trimmedInput = userInput.value?.trim() ?? "";
      if (!trimmedInput) {
        errorMessages.value.push("Enter a steam url or steamid64");
        return;
      }

      // todo refactor to use regex
      let filteredInput = trimmedInput.replace(
        "https://steamcommunity.com/id/",
        ""
      );
      filteredInput = filteredInput.replace(
        "https://steamcommunity.com/profiles/",
        ""
      );

      loading.value = true;
      comments.value = await api.getAllCommentsForUser(filteredInput);
      loading.value = false;
    };

    return {
      getComments,
      userInput,
      comments,
      loading,
      clearErrorMessages,
      errorMessages,
      apiErrorMessage: computed(() => errorStore.apiErrorMessage.value),
      rowColor: (rowIndex: number) => {
        return rowIndex % 2 !== 0 ? "white" : "#b0ceff";
      },
      defaultAvatarSrc:
        "https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/avatars/48/4888d158c81bc8f1d7644321d9eb78b0048a9bda_medium.jpg",
    };
  },
});
</script>

<style scoped>
.error-msg {
  color: red;
}
</style>
