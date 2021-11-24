<template>
  <v-app>
    <v-main>
      <v-container v-if="apiResponse">
        <v-row v-for="(comment, index) in apiResponse" :key="index">
          <v-col>{{ comment.authorUrl }}</v-col>
          <v-col>{{ comment.authorComment }}</v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from "@vue/composition-api";
import api from "@/services/api";
import { AuthorComment } from "backend/src/types/types";

export default defineComponent({
  name: "App",
  setup() {
    const apiResponse = ref<AuthorComment[]>();
    onMounted(async () => {
      apiResponse.value = await api.getCommentsForUser();
    });
    return {
      apiResponse,
    };
  },
});
</script>
