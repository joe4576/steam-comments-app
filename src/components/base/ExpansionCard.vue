<template>
  <v-expansion-panels focusable>
    <v-expansion-panel v-bind="$attrs">
      <v-expansion-panel-header>{{ title }}</v-expansion-panel-header>
      <v-expansion-panel-content>
        <slot />
        <template v-if="hasControlsSlot">
          <v-divider />
          <slot name="controls" :padding="'pt-2'" />
        </template>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts">
import { computed, defineComponent } from "@vue/composition-api";

export default defineComponent({
  name: "FilterExpansionCard",
  props: {
    title: {
      type: String,
      required: false,
      default: "Filter Expansion Card",
    },
  },
  setup(props, context) {
    return {
      hasControlsSlot: computed(() => !!context.slots.controls),
    };
  },
});
</script>
