import type { Media, MediaDetail } from "./types";

/**
 * AniList GraphQL client.
 *
 * Called straight from the browser on purpose — AniList rate-limits per IP, so
 * every user gets their own budget. Proxying this through a route handler would
 * put the whole app behind one server IP. See .docs/04-decisions.md#d3.
 */
const ENDPOINT = "https://graphql.anilist.co";

export class AniListError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AniListError";
  }
}

async function gql<T>(
  query: string,
  variables: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
    signal,
  });

  if (res.status === 429) {
    const retry = res.headers.get("Retry-After");
    throw new AniListError(
      `Rate limited by AniList. Try again in ${retry ?? "60"}s.`,
      429,
    );
  }

  const json = (await res.json().catch(() => null)) as {
    data?: T;
    errors?: { message: string }[];
  } | null;

  // AniList returns a 404 body with `errors: [{ message: "Private User" }]`
  // rather than a network failure — surface the message, not the status.
  if (json?.errors?.length) {
    throw new AniListError(json.errors[0].message, res.status);
  }
  if (!res.ok || !json?.data) {
    throw new AniListError(`AniList request failed (${res.status})`, res.status);
  }
  return json.data;
}

const MEDIA_FIELDS = `
  id
  idMal
  title { romaji english }
  seasonYear
  format
  coverImage { large color }
`;

type RawMedia = {
  id: number;
  idMal: number | null;
  title: { romaji: string | null; english: string | null };
  seasonYear: number | null;
  format: string | null;
  coverImage: { large: string | null; color: string | null } | null;
};

function toMedia(m: RawMedia): Media {
  return {
    key: `al:${m.id}`,
    source: "anilist",
    id: m.id,
    idMal: m.idMal ?? null,
    title: m.title.romaji ?? m.title.english ?? "Untitled",
    titleEn: m.title.english ?? null,
    cover: m.coverImage?.large ?? "",
    year: m.seasonYear ?? null,
    format: m.format ?? null,
    color: m.coverImage?.color ?? null,
  };
}

/* ── search ─────────────────────────────────────────────────────────────── */

const SEARCH_QUERY = `
  query ($s: String, $perPage: Int) {
    Page(perPage: $perPage) {
      media(search: $s, type: ANIME, sort: SEARCH_MATCH) { ${MEDIA_FIELDS} }
    }
  }
`;

export async function searchAnime(
  query: string,
  signal?: AbortSignal,
  perPage = 30,
): Promise<Media[]> {
  const q = query.trim();
  if (!q) return [];
  const data = await gql<{ Page: { media: RawMedia[] } }>(
    SEARCH_QUERY,
    { s: q, perPage },
    signal,
  );
  return data.Page.media.map(toMedia);
}

/* ── trending (the catalog's resting state, before anyone types) ────────── */

const TRENDING_QUERY = `
  query ($perPage: Int) {
    Page(perPage: $perPage) {
      media(type: ANIME, sort: TRENDING_DESC) { ${MEDIA_FIELDS} }
    }
  }
`;

export async function fetchTrending(
  signal?: AbortSignal,
  perPage = 30,
): Promise<Media[]> {
  const data = await gql<{ Page: { media: RawMedia[] } }>(
    TRENDING_QUERY,
    { perPage },
    signal,
  );
  return data.Page.media.map(toMedia);
}

/* ── import a public list ───────────────────────────────────────────────── */

type ScoreFormat =
  | "POINT_100"
  | "POINT_10_DECIMAL"
  | "POINT_10"
  | "POINT_5"
  | "POINT_3";

/**
 * `score` is on the *user's own* scale, not a fixed one — an identical rating
 * comes back as 9 on one profile and 78 on another. Normalise to 0-100 so the
 * import can be sorted best-first.
 */
function normalizeScore(score: number, format: ScoreFormat | null): number {
  if (!score) return 0;
  switch (format) {
    case "POINT_10_DECIMAL":
      return Math.round(score * 10);
    case "POINT_10":
      return score * 10;
    case "POINT_5":
      return score * 20;
    case "POINT_3":
      return Math.round((score / 3) * 100);
    case "POINT_100":
    default:
      return score;
  }
}

const LIST_QUERY = `
  query ($u: String) {
    MediaListCollection(userName: $u, type: ANIME) {
      user { mediaListOptions { scoreFormat } }
      lists { name entries { score media { ${MEDIA_FIELDS} } } }
    }
  }
`;

/**
 * Pulls a public AniList profile's whole collection in one request, no auth.
 * Entries can appear in both a status list and a custom list, so dedupe by key.
 * Returns highest-rated first; unrated titles keep their original order at the end.
 */
export async function fetchUserList(
  username: string,
  signal?: AbortSignal,
): Promise<Media[]> {
  const name = username.trim();
  if (!name) return [];

  const data = await gql<{
    MediaListCollection: {
      user: { mediaListOptions: { scoreFormat: ScoreFormat | null } | null };
      lists: { name: string; entries: { score: number; media: RawMedia }[] }[];
    } | null;
  }>(LIST_QUERY, { u: name }, signal);

  const collection = data.MediaListCollection;
  if (!collection) return [];

  const format = collection.user?.mediaListOptions?.scoreFormat ?? null;
  const seen = new Map<string, { media: Media; score: number }>();

  for (const list of collection.lists) {
    for (const entry of list.entries) {
      const media = toMedia(entry.media);
      const score = normalizeScore(entry.score, format);
      const prev = seen.get(media.key);
      if (!prev || score > prev.score) seen.set(media.key, { media, score });
    }
  }

  return [...seen.values()]
    .sort((a, b) => b.score - a.score)
    .map((x) => x.media);
}

/* ── detail, for the card modal ─────────────────────────────────────────── */

const DETAIL_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id idMal siteUrl
      description(asHtml: false)
      genres episodes duration status season seasonYear averageScore format
      coverImage { extraLarge large }
      bannerImage
      studios(isMain: true) { nodes { name } }
      title { romaji english native }
    }
  }
`;

/** AniList still emits <br> and <i> in `asHtml: false` descriptions. */
function stripTags(html: string | null): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function fetchAnimeDetail(
  id: number,
  signal?: AbortSignal,
): Promise<MediaDetail> {
  const data = await gql<{
    Media: {
      id: number;
      idMal: number | null;
      siteUrl: string;
      description: string | null;
      genres: string[];
      episodes: number | null;
      duration: number | null;
      status: string | null;
      season: string | null;
      seasonYear: number | null;
      averageScore: number | null;
      format: string | null;
      coverImage: { extraLarge: string | null; large: string | null } | null;
      bannerImage: string | null;
      studios: { nodes: { name: string }[] };
      title: {
        romaji: string | null;
        english: string | null;
        native: string | null;
      };
    };
  }>(DETAIL_QUERY, { id }, signal);

  const m = data.Media;
  return {
    id: m.id,
    idMal: m.idMal ?? null,
    siteUrl: m.siteUrl,
    malUrl: m.idMal ? `https://myanimelist.net/anime/${m.idMal}` : null,
    description: stripTags(m.description),
    genres: m.genres ?? [],
    episodes: m.episodes ?? null,
    duration: m.duration ?? null,
    status: m.status ?? null,
    season: m.season ?? null,
    seasonYear: m.seasonYear ?? null,
    averageScore: m.averageScore ?? null,
    format: m.format ?? null,
    studio: m.studios?.nodes?.[0]?.name ?? null,
    cover: m.coverImage?.extraLarge ?? m.coverImage?.large ?? "",
    banner: m.bannerImage ?? null,
    title: m.title.romaji ?? m.title.english ?? "Untitled",
    titleEn: m.title.english ?? null,
    titleNative: m.title.native ?? null,
  };
}
