const BASE_URL = process.env.VUE_APP_BASE_URL;
import { AuthorComment } from "../../../../backend/src/types/types";

const getAllCommentsForUser = async (steamId64OrVanityUrl: string) => {
  const url = `${BASE_URL}/comments/${steamId64OrVanityUrl}`;
  const response = await fetch(url);
  const value = (await response.json()) as AuthorComment[];
  return value;
};

export default {
  getAllCommentsForUser,
};
