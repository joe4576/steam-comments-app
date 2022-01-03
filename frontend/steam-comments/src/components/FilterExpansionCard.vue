<template>
  <expansion-card v-bind="$attrs">
    <template #default>
      <v-container>
        <v-form ref="form">
          <v-text-field
            v-model="steamUrl"
            @keyup.enter="$emit('steamUrlResult', steamUrl)"
            label="Filter by Steam URL"
            clearable
          />
          <v-text-field
            v-model="steamName"
            @keyup.enter="$emit('steamNameResult', steamName)"
            label="Filter by Steam Name"
            clearable
          />
          <v-text-field
            v-model="comment"
            @keyup.enter="$emit('commentResult', comment)"
            label="Filter by Comment"
            clearable
          />
        </v-form>
      </v-container>
    </template>
    <template #controls>
      <v-container>
        <v-row>
          <v-col cols="12" sm="auto">
            <v-btn @click="resetFormValues(true)" block>Reset</v-btn>
          </v-col>
          <v-spacer />
          <v-col cols="12" sm="auto">
            <v-btn @click="submit()" class="primary" block>Filter</v-btn>
          </v-col>
        </v-row>
      </v-container>
    </template>
  </expansion-card>
</template>

<script lang="ts">
import { defineComponent, ref } from "@vue/composition-api";
import ExpansionCard from "@/components/base/ExpansionCard.vue";

interface FormInterface {
  reset: () => void;
}

export interface FilterExpansionCardInterface {
  resetFormValues: (emitEvent?: boolean) => void;
}

export default defineComponent({
  name: "FilterExpansionCard",
  components: {
    ExpansionCard,
  },
  setup(props, context) {
    const steamUrl = ref("");
    const steamName = ref("");
    const comment = ref("");
    const form = ref<FormInterface | null>(null);

    return {
      steamUrl,
      steamName,
      comment,
      form,

      // Clear form values with the option of emitting a reset event.
      resetFormValues: (emitEvent: boolean = false) => {
        form.value?.reset();
        if (emitEvent) {
          context.emit("reset");
        }
      },

      submit: () => {
        if (steamUrl.value) {
          context.emit("steamUrlResult", steamUrl.value);
        }

        if (steamName.value) {
          context.emit("steamNameResult", steamName.value);
        }

        if (comment.value) {
          context.emit("commentResult", comment.value);
        }
      },
    };
  },
});
</script>
