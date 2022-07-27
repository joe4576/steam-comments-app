import { ref } from "@vue/composition-api";

const apiErrorMessage = ref("");

export default {
  apiErrorMessage,
  clearApiErrorMessage: () => {
    apiErrorMessage.value = "";
  },
};
