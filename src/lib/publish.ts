import { parseSaveFile } from "./storage.ts";
import type { SaveFile } from "./types";

/**
 * Everything that has to be true before a board is allowed into the database,
 * plus the denormalized thumbnail that goes with it.
 *
 * **This module runs on both sides.** `convex/tierlists.ts` imports it so the
 * caps and the sanitiser are enforced where it counts, and the editor imports
 * it so the user is told before a 300-title board is rejected. A rule that
 * exists in only one of the two places drifts — see
 * .docs/architecture/sharing.md.
 *
 * Pure and dependency-free apart from `parseSaveFile`, so `node --test` runs it
 * directly (hence the `.ts` on that import).
 */

/**
 * Who can reach a published board.
 *
 * `unlisted` is the default on purpose: pressing Share asks for a link, not for
 * an audience, and opting into the feed should be a second, deliberate act. It
 * also means the first published boards can't fill the feed with test data.
 */
export type Visibility = "public" | "unlisted" | "private";

export const VISIBILITIES: readonly {
  value: Visibility;
  label: string;
  hint: string;
}[] = [
  { value: "unlisted", label: "Unlisted", hint: "Anyone with the link. Not in the feed." },
  { value: "public", label: "Public", hint: "Anyone with the link, and it shows in the feed." },
  { value: "private", label: "Private", hint: "Only you. The link 404s for everyone else." },
];

export const LIMITS = {
  /** Convex caps a document at 1 MB; nothing legitimate approaches this. */
  bytes: 256 * 1024,
  items: 500,
  tiers: 26,
  title: 120,
  description: 500,
  tierLabel: 24,
  mediaTitle: 200,
} as const;

/** Thrown for anything the publisher can fix by editing the board. */
export class PublishError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublishError";
  }
}

/* ── sanitisation ───────────────────────────────────────────────────────── */

/**
 * Title, description and tier labels are the only free text the user controls.
 * React escapes on render, so this is defence in depth rather than the only
 * guard — but the stored value is also what an OG card and a future email would
 * use, and those do not escape for you.
 *
 * The pattern requires a letter after `<` so arithmetic ("1 < 2") survives.
 */
export const sanitizeText = (value: string, max: number): string =>
  value
    .replace(/<\/?[a-zA-Z][^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

/* ── image allowlist ────────────────────────────────────────────────────── */

/**
 * Registrable domains a published board may load cover art from. Without this
 * a board is an arbitrary-URL renderer: a tracking pixel host and someone
 * else's bandwidth bill. Add a domain here when a catalog source is added, not
 * when a user asks.
 */
const IMAGE_HOSTS = ["anilist.co", "myanimelist.net"];

export function isAllowedImage(url: string): boolean {
  if (!url) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  return IMAGE_HOSTS.some(
    (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`),
  );
}

/* ── thumbnail ──────────────────────────────────────────────────────────── */

export const PREVIEW_ROWS = 6;
export const PREVIEW_SWATCHES = 8;

/**
 * One tier of the miniature board shown on a feed or listing card.
 * `swatches` are AniList's dominant cover colours, already stored on each
 * `Media`. Colours rather than cover URLs on purpose: a listing page renders
 * dozens of these, and a grid of swatches costs no image requests and cannot
 * poison the CORS cache the real covers share (see `lib/img.ts`).
 */
export type PreviewRow = {
  label: string;
  color: string;
  swatches: string[];
};

export function previewOf(save: SaveFile): PreviewRow[] {
  return save.tiers.slice(0, PREVIEW_ROWS).map((tier) => ({
    label: tier.label.slice(0, 3),
    color: tier.color,
    swatches: tier.items
      .slice(0, PREVIEW_SWATCHES)
      .map((key) => save.media[key]?.color || "#3f424d"),
  }));
}

/* ── the gate ───────────────────────────────────────────────────────────── */

export type PreparedBoard = {
  data: SaveFile;
  itemCount: number;
  preview: PreviewRow[];
};

/** Titles on the board, tiers and pool alike — `media` holds exactly those. */
export const itemCountOf = (save: SaveFile): number =>
  Object.keys(save.media).length;

/**
 * Parses, caps and sanitises an untrusted board. Throws `PublishError` with a
 * message meant for the person who pressed Publish.
 *
 * Caps come before sanitising so an oversized board fails fast, and the byte
 * check comes last because sanitising can only shrink the payload.
 */
export function prepareBoard(raw: unknown): PreparedBoard {
  const save = parseSaveFile(raw);

  const itemCount = itemCountOf(save);
  if (itemCount > LIMITS.items) {
    throw new PublishError(
      `Published boards are capped at ${LIMITS.items} titles — this board has ${itemCount}. Remove some, or keep it as a save file.`,
    );
  }
  if (save.tiers.length > LIMITS.tiers) {
    throw new PublishError(
      `Published boards are capped at ${LIMITS.tiers} tiers — this board has ${save.tiers.length}.`,
    );
  }

  const data: SaveFile = {
    ...save,
    title: sanitizeText(save.title, LIMITS.title) || "Untitled",
    tiers: save.tiers.map((tier) => ({
      ...tier,
      label: sanitizeText(tier.label, LIMITS.tierLabel),
    })),
    media: Object.fromEntries(
      Object.entries(save.media).map(([key, media]) => [
        key,
        {
          ...media,
          title: sanitizeText(media.title, LIMITS.mediaTitle),
          cover: isAllowedImage(media.cover) ? media.cover : "",
        },
      ]),
    ),
  };

  const bytes = new TextEncoder().encode(JSON.stringify(data)).length;
  if (bytes > LIMITS.bytes) {
    throw new PublishError(
      `This board serialises to ${Math.round(bytes / 1024)} KB, over the ${LIMITS.bytes / 1024} KB publish limit.`,
    );
  }

  return { data, itemCount, preview: previewOf(data) };
}

/* ── share links ────────────────────────────────────────────────────────── */

/**
 * The canonical share path. `slug` is a `nanoid(10)` minted server-side, not a
 * title slug: titles collide, change, and leak content into the URL.
 */
export const boardPath = (slug: string): string => `/t/${slug}`;

/** Absolute URL for the copy-to-clipboard button. Browser-only. */
export const boardUrl = (slug: string): string =>
  `${window.location.origin}${boardPath(slug)}`;
