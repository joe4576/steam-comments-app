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
}

interface SteamResolveVanityUrlData {
  steamid?: string;
  success: number;
  message?: string;
}
export interface SteamResolveVanityUrlReponse {
  response: SteamResolveVanityUrlData;
}

interface PlayerSummary {
  steamid: string;
  communityvisibilitystate: number | null;
  profilestate: number | null;
  personaname: string | null;
  commentpermission: number | null;
  profileurl: string | null;
  avatar: string | null;
  avatarmedium: string | null;
  avatarfull: string | null;
  avatarhash: string | null;
  personastate: number | null;
  primaryclanid: string | null;
  timecreated: number | null;
  personastateflags: 0 | null;
  loccountrycode: string | null;
  locstatecode: string | null;
}

interface PlayerSummaries {
  players: PlayerSummary[];
}

export interface SummaryResponse {
  response: PlayerSummaries;
}
