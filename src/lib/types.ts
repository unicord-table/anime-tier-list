/**
 * The one shape that lives in localStorage, the exported .json, the (future)
 * Postgres `data` column and the (future) Drive file. See .docs/02-data-model.md
 * before changing anything here.
 */

/** `${source}:${id}` — e.g. "al:154587". Prefixed so sources can mix. */
export type MediaKey = string;

export type MediaSource = "anilist" | "mal";

export type Media = {
  key: MediaKey;
  source: MediaSource;
  id: number;
  /** Cross-source join key. Present on every AniList result. */
  idMal: number | null;
  title: string;
  titleEn: string | null;
  cover: string;
  year: number | null;
  format: string | null;
  /** AniList's dominant cover colour — seeds the placeholder gradient. */
  color?: string | null;
};

export type Tier = {
  id: string;
  label: string;
  color: string;
  items: MediaKey[];
};

export type SaveFile = {
  schema: 1;
  title: string;
  /** ISO 8601 */
  updatedAt: string;
  tiers: Tier[];
  pool: MediaKey[];
  media: Record<MediaKey, Media>;
};

/**
 * A drop target. Either the pool, or a specific tier.
 * Tier regions are `tier:<tierId>` so one string identifies any target.
 */
export type Region = "pool" | `tier:${string}`;

export const isTierRegion = (r: Region): r is `tier:${string}` =>
  r.startsWith("tier:");

export const tierIdOf = (r: Region): string | null =>
  isTierRegion(r) ? r.slice(5) : null;

/** Full detail record for the card modal. Never persisted — fetched on open. */
export type MediaDetail = {
  id: number;
  idMal: number | null;
  siteUrl: string;
  malUrl: string | null;
  description: string;
  genres: string[];
  episodes: number | null;
  duration: number | null;
  status: string | null;
  season: string | null;
  seasonYear: number | null;
  averageScore: number | null;
  format: string | null;
  studio: string | null;
  cover: string;
  banner: string | null;
  title: string;
  titleEn: string | null;
  titleNative: string | null;
};
