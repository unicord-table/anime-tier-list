import { strict as assert } from "node:assert";
import test from "node:test";

import { createEmptySave } from "./board.ts";
import {
  LIMITS,
  PublishError,
  boardPath,
  isAllowedImage,
  itemCountOf,
  prepareBoard,
  previewOf,
  sanitizeText,
} from "./publish.ts";
import type { Media, SaveFile } from "./types.ts";

/** Run with: npm test */

const anime = (id: number, over: Partial<Media> = {}): Media => ({
  key: `al:${id}`,
  source: "anilist",
  id,
  idMal: null,
  title: `Anime ${id}`,
  titleEn: null,
  cover: `https://s4.anilist.co/file/anilistcdn/media/anime/cover/${id}.jpg`,
  year: 2024,
  format: "TV",
  color: "#aa3366",
  ...over,
});

/** A board with `count` titles, all in the first tier. */
function boardWith(count: number, over: Partial<Media> = {}): SaveFile {
  const save = createEmptySave();
  const media: Record<string, Media> = {};
  const keys: string[] = [];
  for (let i = 1; i <= count; i++) {
    const m = anime(i, over);
    media[m.key] = m;
    keys.push(m.key);
  }
  return {
    ...save,
    media,
    tiers: save.tiers.map((t, i) => (i === 0 ? { ...t, items: keys } : t)),
  };
}

/* ── sanitisation ───────────────────────────────────────────────────────── */

test("sanitizeText strips tags, collapses whitespace and truncates", () => {
  assert.equal(sanitizeText("<b>Bold</b> pick", 100), "Bold pick");
  assert.equal(sanitizeText("<script>alert(1)</script>hi", 100), "alert(1)hi");
  assert.equal(sanitizeText("  spaced   out \n text ", 100), "spaced out text");
  assert.equal(sanitizeText("abcdef", 3), "abc");
});

test("sanitizeText leaves arithmetic alone", () => {
  // The tag pattern needs a letter after `<`, so this is not markup.
  assert.equal(sanitizeText("1 < 2 and 3 > 2", 100), "1 < 2 and 3 > 2");
});

/* ── image allowlist ────────────────────────────────────────────────────── */

test("only https catalog CDNs are allowed image sources", () => {
  assert.ok(isAllowedImage("https://s4.anilist.co/file/x.jpg"));
  assert.ok(isAllowedImage("https://anilist.co/x.jpg"));
  assert.ok(isAllowedImage("https://cdn.myanimelist.net/images/x.jpg"));

  assert.equal(isAllowedImage("http://s4.anilist.co/x.jpg"), false, "plain http");
  assert.equal(isAllowedImage("https://evil.example/x.jpg"), false, "other host");
  assert.equal(
    isAllowedImage("https://anilist.co.evil.example/x.jpg"),
    false,
    "suffix must be a label boundary, not a substring",
  );
  assert.equal(isAllowedImage("javascript:alert(1)"), false, "not a URL scheme we serve");
  assert.equal(isAllowedImage(""), false);
  assert.equal(isAllowedImage("not a url"), false);
});

/* ── the gate ───────────────────────────────────────────────────────────── */

test("prepareBoard passes an ordinary board through", () => {
  const { data, itemCount, preview } = prepareBoard(boardWith(3));
  assert.equal(itemCount, 3);
  assert.equal(data.tiers[0].items.length, 3);
  assert.equal(preview.length, data.tiers.length);
  assert.deepEqual(
    preview[0].swatches,
    ["#aa3366", "#aa3366", "#aa3366"],
    "swatches come from the stored cover colours",
  );
});

test("prepareBoard sanitises every piece of free text", () => {
  const board = boardWith(1, { title: "<i>Sneaky</i> title" });
  board.title = "<h1>My</h1> board";
  board.tiers[0].label = "<b>S</b>";

  const { data } = prepareBoard(board);
  assert.equal(data.title, "My board");
  assert.equal(data.tiers[0].label, "S");
  assert.equal(data.media["al:1"].title, "Sneaky title");
});

test("prepareBoard drops cover URLs that are not on the allowlist", () => {
  const board = boardWith(1, { cover: "https://tracker.example/pixel.gif" });
  const { data } = prepareBoard(board);
  assert.equal(data.media["al:1"].cover, "");
});

test("prepareBoard rejects a board over the item cap, and says by how much", () => {
  const board = boardWith(LIMITS.items + 1);
  assert.throws(
    () => prepareBoard(board),
    (err: unknown) =>
      err instanceof PublishError && err.message.includes(String(LIMITS.items + 1)),
  );
});

test("prepareBoard rejects a board over the tier cap", () => {
  const board = createEmptySave();
  board.tiers = Array.from({ length: LIMITS.tiers + 1 }, (_, i) => ({
    id: `t${i}`,
    label: "X",
    color: "#ffffff",
    items: [],
  }));
  assert.throws(() => prepareBoard(board), PublishError);
});

test("prepareBoard rejects a board over the byte cap", () => {
  const board = boardWith(4, {
    // Well under the item cap, well over the byte cap.
    titleEn: "x".repeat(LIMITS.bytes),
  });
  assert.throws(
    () => prepareBoard(board),
    (err: unknown) => err instanceof PublishError && /publish limit/.test(err.message),
  );
});

test("prepareBoard rejects malformed input rather than storing it", () => {
  assert.throws(() => prepareBoard({ schema: 2 }));
  assert.throws(() => prepareBoard(null));
});

test("an empty title falls back rather than publishing as blank", () => {
  const board = boardWith(1);
  board.title = "<i></i>";
  assert.equal(prepareBoard(board).data.title, "Untitled");
});

/* ── preview ────────────────────────────────────────────────────────────── */

test("previewOf caps rows and swatches so a card payload stays small", () => {
  const save = createEmptySave();
  const media: Record<string, Media> = {};
  const keys: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const m = anime(i);
    media[m.key] = m;
    keys.push(m.key);
  }
  const board: SaveFile = {
    ...save,
    media,
    // Ten tiers, twenty titles in each.
    tiers: Array.from({ length: 10 }, (_, i) => ({
      id: `t${i}`,
      label: "Tier",
      color: "#ffffff",
      items: keys,
    })),
  };

  const preview = previewOf(board);
  assert.equal(preview.length, 6);
  assert.equal(preview[0].swatches.length, 8);
  assert.equal(preview[0].label, "Tie", "labels are clipped to fit the swatch");
});

test("previewOf falls back to a neutral swatch when a title has no colour", () => {
  const board = boardWith(1, { color: null });
  assert.deepEqual(previewOf(board)[0].swatches, ["#3f424d"]);
});

/* ── misc ───────────────────────────────────────────────────────────────── */

test("itemCountOf counts every title on the board, pool included", () => {
  const board = boardWith(3);
  board.pool = ["al:1"];
  assert.equal(itemCountOf(board), 3, "media holds each title exactly once");
});

test("boardPath is the share URL shape", () => {
  assert.equal(boardPath("abc123XYZ_"), "/t/abc123XYZ_");
});
