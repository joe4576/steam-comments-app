import { Handler } from "@netlify/functions";
import dotenv from "dotenv";
import { JSDOM } from "jsdom";
import fetch, { RequestInit } from "node-fetch";

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
    const vanityUrl = await getTypedApiResponse<SteamResolveVanityUrlReponse>(
      `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${process.env.STEAM_API_KEY}&vanityurl=${input}`
    );
    return vanityUrl.response?.steamid ?? undefined;
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
): Promise<AuthorComment[] | null> => {
  // kennyS steamID64: 76561198024905796
  // my steamId: 76561198085973818
  // limit at 1000 for now
  const url = `https://steamcommunity.com/comment/Profile/render/${steamId64}/-1/?start=0&count=1000`;

  const steamCommentData = await getTypedApiResponse<SteamCommentData>(url, {
    headers: {
      Origin: "https://steamcommunity.com",
      Host: "steamcommunity.com",
      Accept: "text/javascript, text/html, application/xml, text/xml, */*",
    },
  });

  if (steamCommentData.total_count === 0) {
    return null;
  } else {
    const dom = new JSDOM(steamCommentData.comments_html);

    const profileComments: AuthorComment[] = [];

    // maps a comment id to an author comment object
    const commentMap = new Map<string, AuthorComment>();

    const commentContents = dom.window.document.querySelectorAll(
      ".commentthread_comment"
    );

    commentContents.forEach((ct) => {
      const commentThreads = ct.querySelectorAll(
        ".commentthread_comment_content"
      );

      const commentId = ct.getAttribute("id")!.toString();

      // get text content and comment author url
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

        const personaName = c.querySelector("bdi")?.innerHTML.trim();

        if (authorUrl && commentText) {
          commentMap.set(commentId, {
            authorUrl: authorUrl,
            authorComment: commentText,
            personaName: personaName ?? "",
            avatarSrc: "",
          });
        }
      });

      // get avatar src
      const allImageElements = ct.querySelector(
        ".commentthread_comment_avatar a > img"
      );

      const mediumImageSrc = allImageElements!
        .getAttribute("srcset")
        ?.split(" ")
        .find((src) => src.includes("medium"));

      const existingCommentObject = commentMap.get(commentId);
      if (existingCommentObject) {
        existingCommentObject.avatarSrc = mediumImageSrc ?? "";
      }
    });

    // Add each comment to an array to be returned
    commentMap.forEach((comment) => {
      profileComments.push(comment);
    });

    return profileComments;
  }
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

//#region Types

interface SteamCommentData {
  success: string;
  name: string;
  start: number;
  pageSize: number;
  total_count: number;
  updates: number;
  has_upvoted: number;
  comments_html: string;
  timelastpost: string;
}

interface AuthorComment {
  authorUrl: string;
  authorComment: string;
  personaName: string;
  avatarSrc: string;
}

interface SteamResolveVanityUrlData {
  steamid?: string;
  success: number;
  message?: string;
}

interface SteamResolveVanityUrlReponse {
  response?: SteamResolveVanityUrlData;
}

//#endregion

/**
 * Note: importing anything from other files throws the following error:
 * `Module did not self-register: '.../.netlify/functions-serve/comments/src/node_modules/canvas/build/Release/canvas.node'`
 * This has something to do with the `canvas` package which is a dependency of `JSDom`.
 *
 * Not entirely sure if this is a netlify CLI issue with `JSDom`, or whether it is just
 * an M1 Mac issue. This needs further investigation.
 */

export { handler };