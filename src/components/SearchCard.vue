<template>
  <v-card>
    <v-container>
      <v-row class="mx-3">
        <v-col>
          <v-form @submit.prevent="$emit('search')">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="internalUserInput"
                  clearable
                  autofocus
                  @click:clear="$emit('clear-error-messages')"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" sm="auto">
                <v-btn @click="$emit('search')" block> Get comments </v-btn>
              </v-col>
            </v-row>
          </v-form>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<script lang="ts">
import { computed, defineComponent } from "@vue/composition-api";

export default defineComponent({
  name: "SearchCard",
  model: {
    event: "input",
    prop: "userInput",
  },
  props: {
    userInput: {
      type: String,
      required: false,
      default: "",
    },
  },
  setup(props, context) {
    return {
      internalUserInput: computed({
        get: () => props.userInput,
        set: (value: string) => context.emit("input", value),
      }),
    };
  },
});
</script>
