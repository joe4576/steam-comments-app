import errorStore from "@/store/errorStore";
import { AuthorComment } from "../../../../backend/src/types/types";

const BASE_URL = process.env.VUE_APP_BASE_URL;

async function makeApiCall<T>(url: string): Promise<T | null> {
  errorStore.clearApiErrorMessage();
  const response = await fetch(url);
  if (response.status !== 200) {
    errorStore.apiErrorMessage.value = response.statusText;
    return null;
  }
  return (await response.json()) as T;
}

const getAllCommentsForUser = async (
  steamId64OrVanityUrl: string
): Promise<AuthorComment[] | null> => {
  return await makeApiCall<AuthorComment[] | null>(
    `${BASE_URL}/comments/${steamId64OrVanityUrl}`
  );
};

export default {
  getAllCommentsForUser,
};
