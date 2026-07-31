import { strict as assert } from "node:assert";
import test from "node:test";

import {
  addManyToPool,
  addMedia,
  createEmptySave,
  moveItem,
  rankedCount,
  removeItem,
  removeTier,
} from "./board.ts";
import type { Media, SaveFile } from "./types.ts";

/** Run with: npm test */

const anime = (id: number, title = `Anime ${id}`): Media => ({
  key: `al:${id}`,
  source: "anilist",
  id,
  idMal: id + 1000,
  title,
  titleEn: null,
  cover: "",
  year: 2024,
  format: "TV",
  color: null,
});

/** A board with 1,2,3 in tier t1 and 4,5 in the pool. */
function fixture(): SaveFile {
  let save = createEmptySave();
  for (const id of [1, 2, 3]) save = addMedia(save, anime(id), "tier:t1", null);
  for (const id of [4, 5]) save = addMedia(save, anime(id), "pool", null);
  return save;
}

const tier = (s: SaveFile, id: string) =>
  s.tiers.find((t) => t.id === id)!.items;

test("appends in order", () => {
  const s = fixture();
  assert.deepEqual(tier(s, "t1"), ["al:1", "al:2", "al:3"]);
  assert.deepEqual(s.pool, ["al:4", "al:5"]);
});

test("moves between regions without duplicating", () => {
  const s = moveItem(fixture(), "al:2", "pool", 0);
  assert.deepEqual(tier(s, "t1"), ["al:1", "al:3"]);
  assert.deepEqual(s.pool, ["al:2", "al:4", "al:5"]);
});

test("reordering rightward inside one region lands on the target slot", () => {
  // Dragging the first item onto index 2 must leave it third, not second.
  // Detaching first shifts every later index down by one, so the index needs
  // compensating — this is the case that regresses if that is removed.
  const s = moveItem(fixture(), "al:1", "tier:t1", 2);
  assert.deepEqual(tier(s, "t1"), ["al:2", "al:3", "al:1"]);
});

test("reordering leftward inside one region needs no compensation", () => {
  const s = moveItem(fixture(), "al:3", "tier:t1", 0);
  assert.deepEqual(tier(s, "t1"), ["al:3", "al:1", "al:2"]);
});

test("a key never appears twice after any move", () => {
  let s = fixture();
  for (const target of ["pool", "tier:t1", "tier:t2", "tier:t1"] as const) {
    s = moveItem(s, "al:1", target, 0);
  }
  const all = [...s.pool, ...s.tiers.flatMap((t) => t.items)];
  assert.equal(new Set(all).size, all.length);
  assert.equal(all.filter((k) => k === "al:1").length, 1);
});

test("moving an unknown key is a no-op", () => {
  const s = fixture();
  assert.equal(moveItem(s, "al:999", "pool", 0), s);
});

test("bulk import skips titles already on the board", () => {
  const s = addManyToPool(fixture(), [anime(1), anime(9), anime(4)]);
  assert.deepEqual(s.pool, ["al:4", "al:5", "al:9"]);
});

test("deleting a tier returns its titles to the pool", () => {
  const s = removeTier(fixture(), "t1");
  assert.equal(s.tiers.find((t) => t.id === "t1"), undefined);
  assert.deepEqual(s.pool, ["al:4", "al:5", "al:1", "al:2", "al:3"]);
  assert.equal(rankedCount(s), 0);
});

test("removing a title drops its media record too", () => {
  const s = removeItem(fixture(), "al:1");
  assert.equal("al:1" in s.media, false);
  assert.deepEqual(tier(s, "t1"), ["al:2", "al:3"]);
});
