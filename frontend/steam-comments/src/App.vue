<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <router-link :to="{ name: 'search' }">
        Steam Comments Searcher
      </router-link>
    </v-app-bar>
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
  setup() {},
});
</script>

<style scoped>
.error-msg {
  color: red;
}
.router-link-active {
  text-decoration: none;
  color: white;
}
</style>
