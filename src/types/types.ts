export interface SteamCommentData {
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

export interface AuthorComment {
  authorUrl: string;
  authorComment: string;
  personaName: string;
  avatarSrc: string;
}

export interface SteamResolveVanityUrlData {
  steamid?: string;
  success: number;
  message?: string;
}

export interface SteamResolveVanityUrlReponse {
  response?: SteamResolveVanityUrlData;
}
