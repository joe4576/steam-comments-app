<template>
  <v-app>
    <v-app-bar app color="primary" dark> Steam Comments Searcher </v-app-bar>
    <v-main>
      <v-container>
        <v-form @submit.prevent="getComments()">
          <v-row justify="center">
            <v-col class="mx-auto" cols="6">
              <v-text-field v-model="userInput" clearable autofocus />
            </v-col>
          </v-row>
          <v-row justify="center">
            <v-col class="mx-auto" cols="4">
              <v-btn @click="getComments()" block> Get comments </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-container>
      <v-container v-if="comments">
        <v-row>
          <v-col>
            Found <b>{{ comments.length }}</b> comments.
          </v-col>
        </v-row>
        <v-row v-for="(comment, index) in comments" :key="index">
          <v-col cols="6">
            <a :href="comment.authorUrl" target="_blank">
              {{ comment.authorUrl }}
            </a>
          </v-col>
          <v-col cols="6">{{ comment.authorComment }}</v-col>
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
import { defineComponent, ref } from "@vue/composition-api";
import api from "@/services/api";
import { AuthorComment } from "../../../backend/src/types/types";

export default defineComponent({
  name: "App",
  setup() {
    const userInput = ref("");
    const comments = ref<AuthorComment[] | null>(null);
    const loading = ref(false);

    const getComments = async () => {
      loading.value = true;
      // todo error handling in backend and service
      try {
        comments.value = await api.getAllCommentsForUser(userInput.value);
      } catch (e: any) {
        console.error(e);
      } finally {
        loading.value = false;
      }
    };

    return {
      getComments,
      userInput,
      comments,
      loading,
    };
  },
});
</script>
