import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import express from "express";
import cors from "cors";
import {
  SteamCommentData,
  AuthorComment,
  SteamResolveVanityUrlReponse,
  SummaryResponse,
} from "./types/types";
import dotenv from "dotenv";
import { doesStringOnlyContainNumbers } from "./utils/strings";

dotenv.config();
const app = express();
app.use(cors());

/**
 * Checks if a string containers only numbers. If it does, return it as an assumed valid steamid64.
 * If it contains any numbers, it is assumed to be a vanity url. Check if that url is associated with
 * a steamid64.
 * @param input Steamid64 or vanity url
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
 * Gets raw data from steam community website and strips out the comments
 * @param steamId64 SteamId64 string
 * @returns Array of comment objects with each element containing author profile url and comment
 */
const getProfileCommentsFromSteamId64 = async (
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

    // get unique author steamid64s
    // const uniqueAuthorSteamid64s = commentPairs
    //   .map((c) => c.authorUrl)
    //   .filter((value, index, self) => self.indexOf(value) === index)
    //   .map(async (url) => await getValidSteamId64(url));

    return commentPairs;
  }
};

/**
 * Match up steamid64s with their corresponding persona name
 * @param steamId64s List of steamid64s (max 100)
 * @returns Map of steamId64 to persona name
 */
const getPersonaNameFromSteamId64 = async (steamId64s: string[]) => {
  let formattedString = "[";
  steamId64s.forEach((id, index) => {
    formattedString += `${id}${index !== steamId64s.length - 1 ? "," : ""}`;
  });
  formattedString += "]";

  const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_API_KEY}&format=json&steamids=${formattedString}`;
  const res = await fetch(url);
  const json = (await res.json()) as SummaryResponse;

  const steamId64PersonaNameMap = new Map<string, string>();

  json.response.players.forEach((player) => {
    steamId64PersonaNameMap.set(player.steamid, player.personaname ?? "");
  });

  return steamId64PersonaNameMap;
};

app.get("/test", async (req, res) => {
  // res.send(
  //   await getPersonaNameFromSteamId64([
  //     "76561198308003066",
  //     "76561197984864068",
  //   ])
  // );
  // await getPersonaNameFromSteamId64(["76561198308003066", "76561197984864068"]);
  // await getPeronaNameFromUrl("https://steamcommunity.com/id/jebus123");
  // res.send(
  //   await getPeronaNameFromUrl("https://steamcommunity.com/id/jebus123")
  // );
});

app.get("/comments/:steamId", async (req, res) => {
  const steamId64 = await getValidSteamId64(req.params.steamId);

  if (!steamId64) {
    res.statusMessage = "Steam account not found";
    res.sendStatus(404);
    return;
  }

  const comments = await getProfileCommentsFromSteamId64(steamId64);

  if (!comments) {
    res.statusMessage = "No comments found";
    res.sendStatus(404);
    return;
  }

  res.send(comments);
});

const PORT = 3080;

app.listen(PORT, () => {
  console.log(`Express listening on port ${PORT}...`);
});
