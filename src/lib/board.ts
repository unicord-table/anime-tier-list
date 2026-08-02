import type { Media, MediaKey, Region, SaveFile, Tier } from "./types";

/**
 * Pure operations on a SaveFile. No React, no storage — every one takes a
 * board and returns a new board, which is what makes undo a plain array of
 * snapshots. Covered by board.test.ts.
 *
 * Every import here is type-only and therefore erased at runtime, which is what
 * lets `node board.test.ts` run against this file with no test runner and no
 * build step.
 */

export const TIER_PRESET_COLORS = [
  "#e0698a",
  "#e0975f",
  "#d8c15f",
  "#7fbf7f",
  "#6fa8d8",
  "#9a8fb0",
  "#8f9aa8",
  "#c77fbf",
] as const;

const DEFAULT_TIERS: Tier[] = [
  { id: "t1", label: "S", color: "#e0698a", items: [] },
  { id: "t2", label: "A", color: "#e0975f", items: [] },
  { id: "t3", label: "B", color: "#d8c15f", items: [] },
  { id: "t4", label: "C", color: "#7fbf7f", items: [] },
  { id: "t5", label: "D", color: "#6fa8d8", items: [] },
  { id: "t6", label: "F", color: "#9a8fb0", items: [] },
];

export function createEmptySave(): SaveFile {
  return {
    schema: 1,
    title: "My Anime Tier List",
    updatedAt: new Date().toISOString(),
    tiers: DEFAULT_TIERS.map((t) => ({ ...t, items: [] })),
    pool: [],
    media: {},
  };
}

const touch = (save: SaveFile): SaveFile => ({
  ...save,
  updatedAt: new Date().toISOString(),
});

/** Every key currently placed on the board, tiers and pool alike. */
export function placedKeys(save: SaveFile): Set<MediaKey> {
  const keys = new Set<MediaKey>(save.pool);
  for (const tier of save.tiers) for (const k of tier.items) keys.add(k);
  return keys;
}

export function itemsOf(save: SaveFile, region: Region): MediaKey[] {
  if (region === "pool") return save.pool;
  const id = region.slice(5);
  return save.tiers.find((t) => t.id === id)?.items ?? [];
}

function insertAt(list: MediaKey[], key: MediaKey, index: number | null): MediaKey[] {
  const next = [...list];
  const at = index == null || index < 0 ? next.length : Math.min(index, next.length);
  next.splice(at, 0, key);
  return next;
}

/** Removes a key from every region. */
function detach(save: SaveFile, key: MediaKey): SaveFile {
  return {
    ...save,
    tiers: save.tiers.map((t) => ({ ...t, items: t.items.filter((k) => k !== key) })),
    pool: save.pool.filter((k) => k !== key),
  };
}

/**
 * Moves an already-placed key to `region` at `index`. Detaching first means a
 * move within the same region reorders correctly instead of duplicating.
 */
export function moveItem(
  save: SaveFile,
  key: MediaKey,
  region: Region,
  index: number | null,
): SaveFile {
  if (!key || !(key in save.media)) return save;

  // `index` follows dnd-kit's arrayMove semantics: it is the slot in the list
  // *after* the item has been pulled out, so detach-then-insert is already
  // right for both directions. Compensating for the shift double-counts it.
  const base = detach(save, key);
  if (region === "pool") {
    return touch({ ...base, pool: insertAt(base.pool, key, index) });
  }
  const id = region.slice(5);
  return touch({
    ...base,
    tiers: base.tiers.map((t) =>
      t.id === id ? { ...t, items: insertAt(t.items, key, index) } : t,
    ),
  });
}

/** Adds a catalog result to the board, registering its media record. */
export function addMedia(
  save: SaveFile,
  media: Media,
  region: Region,
  index: number | null,
): SaveFile {
  const withMedia: SaveFile = {
    ...save,
    media: { ...save.media, [media.key]: media },
  };
  return moveItem(withMedia, media.key, region, index);
}

/** Bulk-adds to the end of the pool, skipping anything already on the board. */
export function addManyToPool(save: SaveFile, list: Media[]): SaveFile {
  const placed = placedKeys(save);
  const fresh = list.filter((m) => !placed.has(m.key));
  if (!fresh.length) return save;

  const media = { ...save.media };
  for (const m of fresh) media[m.key] = m;

  return touch({
    ...save,
    media,
    pool: [...save.pool, ...fresh.map((m) => m.key)],
  });
}

/** Takes a title off the board entirely, and drops its now-orphaned record. */
export function removeItem(save: SaveFile, key: MediaKey): SaveFile {
  const base = detach(save, key);
  const media = { ...base.media };
  delete media[key];
  return touch({ ...base, media });
}

/* ── tiers ──────────────────────────────────────────────────────────────── */

export function addTier(save: SaveFile, id: string): SaveFile {
  const color = TIER_PRESET_COLORS[save.tiers.length % TIER_PRESET_COLORS.length];
  return touch({
    ...save,
    tiers: [...save.tiers, { id, label: "New", color, items: [] }],
  });
}

/** Deleting a tier returns its titles to the pool rather than discarding them. */
export function removeTier(save: SaveFile, id: string): SaveFile {
  const tier = save.tiers.find((t) => t.id === id);
  if (!tier) return save;
  return touch({
    ...save,
    tiers: save.tiers.filter((t) => t.id !== id),
    pool: [...save.pool, ...tier.items],
  });
}

/** Moves tier `id` to the slot currently held by `beforeId`. */
export function reorderTiers(save: SaveFile, id: string, beforeId: string): SaveFile {
  const from = save.tiers.findIndex((t) => t.id === id);
  const to = save.tiers.findIndex((t) => t.id === beforeId);
  if (from < 0 || to < 0 || from === to) return save;
  const tiers = [...save.tiers];
  tiers.splice(to, 0, tiers.splice(from, 1)[0]);
  return touch({ ...save, tiers });
}

function patchTier(save: SaveFile, id: string, patch: Partial<Tier>): SaveFile {
  return touch({
    ...save,
    tiers: save.tiers.map((t) => (t.id === id ? { ...t, ...patch } : t)),
  });
}

export const renameTier = (save: SaveFile, id: string, label: string) =>
  patchTier(save, id, { label });

export const recolorTier = (save: SaveFile, id: string, color: string) =>
  patchTier(save, id, { color });

export const setTitle = (save: SaveFile, title: string): SaveFile =>
  touch({ ...save, title });

export const rankedCount = (save: SaveFile): number =>
  save.tiers.reduce((n, t) => n + t.items.length, 0);
