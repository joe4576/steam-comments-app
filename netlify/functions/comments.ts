import { Handler } from "@netlify/functions";
import dotenv from "dotenv";
import fetch, { RequestInit } from "node-fetch";
import {
  AuthorComment,
  SteamCommentData,
  SteamResolveVanityUrlReponse,
} from "../../src/types/types";
import { load } from "cheerio";

dotenv.config();

const getTypedApiResponse = async <T>(
  url: string,
  options?: RequestInit
): Promise<T> => (await fetch(url, options).then((res) => res.json())) as T;

/**
 * Checks if a string contains only numbers. If it does, return it as an assumed valid steamid64.
 * If it contains anything but numbers, it is assumed to be a vanity url. Check if that url is associated with
 * a steamid64.
 * @param input Steamid64 or vanity url
 * @returns A string in the valid steamid64 format (i.e. all numbers)
 */
const getValidSteamId64 = async (
  input: string
): Promise<string | undefined> => {
  const doesInputContainOnlyNumbers = !isNaN(+input);

  if (!doesInputContainOnlyNumbers) {
    const vanityUrl: SteamResolveVanityUrlReponse = await getTypedApiResponse(
      `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${process.env.STEAM_API_KEY}&vanityurl=${input}`
    );
    return vanityUrl.response?.steamid;
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
  steamId64: string | undefined
): Promise<AuthorComment[]> => {
  if (!steamId64) {
    return [];
  }

  // limit at 1000 for now
  const url = `https://steamcommunity.com/comment/Profile/render/${steamId64}/-1/?start=0&count=1000`;

  const steamCommentData: SteamCommentData = await getTypedApiResponse(url, {
    headers: {
      Origin: "https://steamcommunity.com",
      Host: "steamcommunity.com",
      Accept: "text/javascript, text/html, application/xml, text/xml, */*",
    },
  });

  const $ = load(steamCommentData.comments_html);
  const profileComments: AuthorComment[] = [];

  const fallbackAuthorUrl = "https://steamcommunity.com/";
  const fallbackAvatarSrc =
    "https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/avatars/48/4888d158c81bc8f1d7644321d9eb78b0048a9bda_medium.jpg";

  if (steamCommentData.total_count === 0) {
    return [];
  } else {
    $(".commentthread_comment").each((_, el) => {
      const author = $(el).find(".commentthread_comment_author");
      const authorUrl =
        $(author).find(".commentthread_author_link").prop("href") ??
        fallbackAuthorUrl;
      const personaName = $(author).find("bdi").text().trim();
      const authorComment = $(el)
        .find(".commentthread_comment_text")
        .text()
        .trim();
      const avatarSrc =
        $(el).find(".commentthread_comment_avatar img").prop("src") ??
        fallbackAvatarSrc;

      profileComments.push({
        authorComment,
        authorUrl,
        avatarSrc,
        personaName,
      });
    });
  }

  return profileComments;
};

const handler: Handler = async (event, context) => {
  const steamIdOrVanityUrl = event.path.split("/api/comments/")[1] ?? "";
  const steamId64 = await getValidSteamId64(steamIdOrVanityUrl);

  if (!steamId64) {
    return {
      statusCode: 404,
    };
  }

  const comments = await getProfileCommentsFromSteamId64(steamId64);

  return {
    statusCode: 200,
    body: JSON.stringify(comments),
  };
};

export { handler };
