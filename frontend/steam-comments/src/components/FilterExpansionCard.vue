<template>
  <expansion-card v-bind="$attrs">
    <template #default>
      <v-container>
        <v-form ref="form">
          <v-text-field
            v-model="steamUrl"
            @keyup.enter="$emit('steamUrlResult', steamUrl)"
            label="Filter by Steam URL"
          />
          <v-text-field
            v-model="steamName"
            @keyup.enter="$emit('steamNameResult', steamName)"
            label="Filter by Steam Name"
          />
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

export interface FormInterface {
  reset: () => void;
}

export default defineComponent({
  name: "FilterExpansionCard",
  components: {
    ExpansionCard,
  },
  setup(props, context) {
    const steamUrl = ref("");
    const steamName = ref("");
    const form = ref<FormInterface | null>(null);

    const resetForm = () => {
      form.value?.reset();
    };

    return {
      reset: () => {
        resetForm();
        context.emit("reset");
      },
      steamUrl,
      steamName,
      form,
      resetForm,
    };
  },
});
</script>
