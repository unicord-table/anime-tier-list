import type { Media, SaveFile, Tier } from "./types";
// Extension included so Node's ESM loader can walk here from a *.test.ts —
// see .docs/architecture/components.md.
import { TIER_PRESET_COLORS } from "./board.ts";

const SAVE_KEY = "atl:save";

/* ── validation ─────────────────────────────────────────────────────────────
   Hand-written rather than zod: this is one shape, and the check that actually
   matters — that every key in `tiers`/`pool` resolves in `media` — is a
   referential-integrity pass a schema library wouldn't give us for free.
   A malformed file must produce a message, never a white screen. */

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");

function parseMedia(v: unknown, key: string): Media {
  if (!isRecord(v)) throw new Error(`media["${key}"] is not an object`);
  if (typeof v.id !== "number") throw new Error(`media["${key}"].id must be a number`);
  if (typeof v.title !== "string") throw new Error(`media["${key}"].title must be a string`);
  return {
    key,
    source: v.source === "mal" ? "mal" : "anilist",
    id: v.id,
    idMal: typeof v.idMal === "number" ? v.idMal : null,
    title: v.title,
    titleEn: typeof v.titleEn === "string" ? v.titleEn : null,
    cover: typeof v.cover === "string" ? v.cover : "",
    year: typeof v.year === "number" ? v.year : null,
    format: typeof v.format === "string" ? v.format : null,
    color: typeof v.color === "string" ? v.color : null,
  };
}

/**
 * Parses untrusted JSON (an uploaded .json, or whatever is in localStorage)
 * into a SaveFile. Throws with a human-readable reason.
 */
export function parseSaveFile(raw: unknown): SaveFile {
  if (!isRecord(raw)) throw new Error("Save file must be a JSON object");
  if (raw.schema !== 1) throw new Error(`Unsupported save schema: ${String(raw.schema)}`);
  if (!Array.isArray(raw.tiers)) throw new Error("Save file is missing `tiers`");
  if (!isStringArray(raw.pool)) throw new Error("Save file is missing `pool`");
  if (!isRecord(raw.media)) throw new Error("Save file is missing `media`");

  const media: Record<string, Media> = {};
  for (const [key, value] of Object.entries(raw.media)) {
    media[key] = parseMedia(value, key);
  }

  const tiers: Tier[] = raw.tiers.map((t, i) => {
    if (!isRecord(t)) throw new Error(`tiers[${i}] is not an object`);
    if (typeof t.id !== "string") throw new Error(`tiers[${i}].id must be a string`);
    if (!isStringArray(t.items)) throw new Error(`tiers[${i}].items must be an array of keys`);
    return {
      id: t.id,
      label: typeof t.label === "string" ? t.label : "",
      color: typeof t.color === "string" ? t.color : TIER_PRESET_COLORS[0],
      // Referential integrity: silently drop keys with no media record rather
      // than rendering an undefined card.
      items: t.items.filter((k) => k in media),
    };
  });

  return {
    schema: 1,
    title: typeof raw.title === "string" ? raw.title : "Untitled",
    updatedAt:
      typeof raw.updatedAt === "string" ? raw.updatedAt : new Date().toISOString(),
    tiers,
    pool: raw.pool.filter((k) => k in media),
    media,
  };
}

/* ── localStorage ───────────────────────────────────────────────────────── */

export function loadSave(): SaveFile | null {
  if (typeof window === "undefined") return null;
  const text = window.localStorage.getItem(SAVE_KEY);
  if (!text) return null;
  try {
    return parseSaveFile(JSON.parse(text));
  } catch (err) {
    console.warn("Discarding unreadable save file:", err);
    return null;
  }
}

export function persistSave(save: SaveFile): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch (err) {
    // Quota exceeded, private-mode restrictions, etc. Losing autosave silently
    // would be worse than a console warning the user can be told about.
    console.warn("Could not autosave to this device:", err);
  }
}

/* ── file export / import ───────────────────────────────────────────────── */

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "tier-list";

export function downloadSaveFile(save: SaveFile): void {
  const blob = new Blob([JSON.stringify(save, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slugify(save.title)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function readSaveFile(file: File): Promise<SaveFile> {
  const text = await file.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("That file isn't valid JSON");
  }
  return parseSaveFile(json);
}
