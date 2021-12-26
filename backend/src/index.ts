import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import express from "express";
import cors from "cors";
import {
  SteamCommentData,
  AuthorComment,
  SteamResolveVanityUrlReponse,
} from "./types/types";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());

/**
 * Checks if a string containers only numbers. If it does, return it as an assumed valid steamid64.
 * If it contains any numbers, it is assumed to be a vanity url. Check if that url is associated with
 * a steamid64.
 * @param input Any string input
 * @returns A string in the valid steamid64 format (i.e. all numbers)
 */
const getValidSteamId64 = async (
  input: string
): Promise<string | undefined> => {
  const assumedSteamId64 = doesStringOnlyContainNumbers(input);

  if (!assumedSteamId64) {
    const res = await fetch(
      `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${process.env.STEAM_API_KEY}&vanityurl=${input}`
    );
    const json = (await res.json()) as SteamResolveVanityUrlReponse;
    return json.response.steamid ? json.response.steamid : undefined;
  } else {
    return input;
  }
};

/**
 * Check whether a string contains only digits
 * @param stringToCheck Input string
 * @returns True if the string only consists of digits, false if any non-didget is found
 */
const doesStringOnlyContainNumbers = (stringToCheck: string): boolean => {
  return /^\d+$/.test(stringToCheck);
};

/**
 * Gets raw data from steam community website and strips out the comments
 * @param steamId64 SteamId64 string
 * @returns Array of comment objects with each element containing author profile url and comment
 */
const getCommentsFromSteamId64 = async (
  steamId64: string
): Promise<AuthorComment[] | null> => {
  // kennyS steamID64: 76561198024905796
  // my steamId: 76561198085973818
  // limit at 5000 for now
  const url = `https://steamcommunity.com/comment/Profile/render/${steamId64}/-1/?start=0&count=5000`;
  const data = await fetch(url, {
    headers: {
      Origin: "https://steamcommunity.com",
      Host: "steamcommunity.com",
      Accept: "text/javascript, text/html, application/xml, text/xml, */*",
    },
  });
  const payload = (await data.json()) as SteamCommentData;

  if (payload.total_count === 0) {
    return null;
  } else {
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

    return commentPairs;
  }
};

app.get("/comments/:steamId", async (req, res) => {
  const steamId64 = await getValidSteamId64(req.params.steamId);

  if (!steamId64) {
    res.send("Steam account not found");
    return;
  }

  const comments = await getCommentsFromSteamId64(steamId64);

  if (!comments) {
    res.send("No comments found");
    return;
  }

  res.send(comments);
});

const PORT = 3080;

app.listen(PORT, () => {
  console.log(`Express listening on port ${PORT}...`);
});
