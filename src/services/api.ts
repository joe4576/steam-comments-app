import { AuthorComment } from "../../backend/src/types/types";

const BASE_URL = "http://localhost:8089";

const getCommentsForUser = async () => {
  const data = await fetch(BASE_URL + "/comments/76561198085973818");
  return (await data.json()) as AuthorComment[];
};

export default {
  getCommentsForUser,
};
