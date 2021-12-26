<template>
  <v-app>
    <v-app-bar app color="primary" dark> </v-app-bar>

    <v-main>
      <v-text-field v-model="test" />
      {{ test }}
    </v-main>
  </v-app>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from "@vue/composition-api";

export default defineComponent({
  name: "App",
  setup() {
    onMounted(async () => {
      const data = await fetch("/api/comments/76561198085973818");
      console.log(await data.json());
    });
    return {
      test: ref<string>("Hello world"),
    };
  },
});
</script>
