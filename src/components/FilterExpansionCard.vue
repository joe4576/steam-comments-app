<template>
  <expansion-card v-bind="$attrs">
    <template #default>
      <v-container>
        <v-form ref="form">
          <v-text-field
            v-model="filterValues.url"
            @keyup.enter="submit"
            label="Filter by Steam URL"
            clearable
          />
          <v-text-field
            v-model="filterValues.name"
            @keyup.enter="submit"
            label="Filter by Steam Name"
            clearable
          />
          <v-text-field
            v-model="filterValues.comment"
            @keyup.enter="submit"
            label="Filter by Comment"
            clearable
          />
        </v-form>
      </v-container>
    </template>
    <template #controls="{ padding }">
      <v-container>
        <v-row :class="padding">
          <v-col
            cols="12"
            sm="auto"
            :class="{ 'px-0': $vuetify.breakpoint.xsOnly }"
          >
            <v-btn @click="resetFormValues(true)" block>Reset</v-btn>
          </v-col>
          <v-spacer />
          <v-col
            cols="12"
            sm="auto"
            :class="{ 'px-0': $vuetify.breakpoint.xsOnly }"
          >
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

export interface QueryParameters {
  url?: string;
  name?: string;
  comment?: string;
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

    const filterValues = ref<QueryParameters>({});

    return {
      steamUrl,
      steamName,
      comment,
      form,
      filterValues,

      // Clear form values with the option of emitting a reset event.
      resetFormValues: (emitEvent: boolean = false) => {
        form.value?.reset();
        if (emitEvent) {
          context.emit("reset");
        }
      },

      submit: () => context.emit("filter", filterValues.value),
    };
  },
});
</script>
