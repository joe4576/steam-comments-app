import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import express from "express";
import cors from "cors";
import { SteamCommentData, AuthorComment } from "./types/types";

const app = express();
app.use(cors());

const getData = async (steamId: string) => {
  // kennyS steamID64: 76561198024905796
  // my steamId: 76561198085973818
  // limit at 5000 for now
  const url = `https://steamcommunity.com/comment/Profile/render/${steamId}/-1/?start=0&count=5000`;
  const data = await fetch(url, {
    headers: {
      Origin: "https://steamcommunity.com",
      Host: "steamcommunity.com",
      Accept: "text/javascript, text/html, application/xml, text/xml, */*",
    },
  });
  const json = (await data.json()) as SteamCommentData;
  return json;
};

app.get("/comments/:steamId", async (req, res) => {
  const payload = await getData(req.params.steamId);
  const dom = new JSDOM(payload.comments_html);
  const commentThreads = dom.window.document.querySelectorAll(
    ".commentthread_comment_content"
  );
  const commentPairs: AuthorComment[] = [];

  commentThreads.forEach((c) => {
    const authorUrl = (
      c.querySelector(".commentthread_comment_author a") as
        | HTMLAnchorElement
        | undefined
    )?.href;

    const commentText = c
      .querySelector(".commentthread_comment_text")
      ?.innerHTML.trim()
      .replace(/<.*?>/g, "");

    if (authorUrl && commentText) {
      commentPairs.push({ authorUrl: authorUrl, authorComment: commentText });
    }
  });
  res.send(commentPairs);
});

const PORT = 3080;

app.listen(PORT, () => {
  console.log(`Express listening on port ${PORT}...`);
});
