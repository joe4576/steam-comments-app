<template>
  <expansion-card v-bind="$attrs">
    <template #default>
      <v-container>
        <v-form @submit.prevent="$emit('customFilterResult', filterValue)">
          <v-text-field v-model="filterValue" label="Filter by Steam URL" />
        </v-form>
      </v-container>
    </template>
    <template #controls>
      <v-container>
        <v-btn @click="reset()">Reset</v-btn>
      </v-container>
    </template>
  </expansion-card>
</template>

<script lang="ts">
import { defineComponent, ref } from "@vue/composition-api";
import ExpansionCard from "@/components/base/ExpansionCard.vue";

export interface FilterExpansionCardInterface {
  resetValue: () => void;
}

export default defineComponent({
  name: "FilterExpansionCard",
  components: {
    ExpansionCard,
  },
  setup(props, context) {
    const filterValue = ref("");
    const resetValue = () => {
      filterValue.value = "";
    };
    return {
      reset: () => {
        resetValue();
        context.emit("reset");
      },
      filterValue,
      resetValue,
    };
  },
});
</script>
