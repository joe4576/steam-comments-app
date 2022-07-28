<template>
  <v-app>
    <v-app-bar app color="primary" dark> Steam Comments Searcher </v-app-bar>
    <v-main><router-view /></v-main>
  </v-app>
</template>

<script lang="ts">
import { defineComponent } from "@vue/composition-api";
import Search from "@/components/pages/Search.vue";

export default defineComponent({
  name: "App",
  components: {
    Search,
  },
});
</script>
