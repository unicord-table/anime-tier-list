import { strict as assert } from "node:assert";
import test from "node:test";

import {
  FEED_POSTS,
  feedHref,
  selectPosts,
  thumbRows,
  titleCount,
  toFeedSort,
} from "./feed.ts";
import type { FeedPost } from "./feed.ts";

/** Run with: npm test */

const post = (id: string, over: Partial<FeedPost> = {}): FeedPost => ({
  id,
  title: `Board ${id}`,
  excerpt: "",
  author: "Someone",
  handle: `@${id}`,
  hue: 200,
  time: "1h ago",
  likes: 0,
  comments: 0,
  views: "0",
  tags: [],
  spec: [[10], [20, 30]],
  ...over,
});

/* ── selection ──────────────────────────────────────────────────────────── */

test("no query, latest sort: source order, nothing dropped", () => {
  const posts = [post("a"), post("b"), post("c")];
  assert.deepEqual(
    selectPosts(posts).map((p) => p.id),
    ["a", "b", "c"],
  );
});

test("query matches title, author, handle and tags, case-insensitively", () => {
  const posts = [
    post("a", { title: "Mecha, ranked" }),
    post("b", { author: "Echo Garden" }),
    post("c", { handle: "@mdnt_ramen" }),
    post("d", { tags: ["Openings"] }),
    post("e"),
  ];
  const ids = (q: string) => selectPosts(posts, { query: q }).map((p) => p.id);

  assert.deepEqual(ids("MECHA"), ["a"]);
  assert.deepEqual(ids("echo"), ["b"]);
  assert.deepEqual(ids("ramen"), ["c"]);
  assert.deepEqual(ids("opening"), ["d"]);
  assert.deepEqual(ids("   "), ["a", "b", "c", "d", "e"]);
  assert.deepEqual(ids("nothing here"), []);
});

test("trending orders by likes, descending", () => {
  const posts = [post("a", { likes: 5 }), post("b", { likes: 50 }), post("c", { likes: 12 })];
  assert.deepEqual(
    selectPosts(posts, { sort: "trending" }).map((p) => p.id),
    ["b", "c", "a"],
  );
});

test("following keeps only followed authors", () => {
  const posts = [post("a", { following: true }), post("b"), post("c", { following: true })];
  assert.deepEqual(
    selectPosts(posts, { sort: "following" }).map((p) => p.id),
    ["a", "c"],
  );
});

test("query and sort compose", () => {
  const posts = [
    post("a", { tags: ["Mecha"], likes: 5, following: true }),
    post("b", { tags: ["Mecha"], likes: 50 }),
    post("c", { tags: ["Food"], likes: 99, following: true }),
  ];
  assert.deepEqual(
    selectPosts(posts, { query: "mecha", sort: "trending" }).map((p) => p.id),
    ["b", "a"],
  );
  assert.deepEqual(
    selectPosts(posts, { query: "mecha", sort: "following" }).map((p) => p.id),
    ["a"],
  );
});

test("selection never mutates the source array", () => {
  const posts = [post("a", { likes: 1 }), post("b", { likes: 9 })];
  selectPosts(posts, { sort: "trending" });
  assert.deepEqual(
    posts.map((p) => p.id),
    ["a", "b"],
  );
});

/* ── routing ────────────────────────────────────────────────────────────── */

test("toFeedSort falls back to latest for anything unrecognised", () => {
  assert.equal(toFeedSort("trending"), "trending");
  assert.equal(toFeedSort("following"), "following");
  assert.equal(toFeedSort("latest"), "latest");
  assert.equal(toFeedSort(undefined), "latest");
  assert.equal(toFeedSort("popular"), "latest");
  // Repeated params arrive as an array, which is not a sort.
  assert.equal(toFeedSort(["trending", "latest"]), "latest");
});

test("feedHref omits the defaults so `/` stays canonical", () => {
  assert.equal(feedHref(), "/");
  assert.equal(feedHref({ sort: "latest" }), "/");
  assert.equal(feedHref({ sort: "latest", query: "  " }), "/");
  assert.equal(feedHref({ sort: "trending" }), "/?sort=trending");
  assert.equal(feedHref({ query: "mecha" }), "/?q=mecha");
  assert.equal(feedHref({ sort: "trending", query: " mecha " }), "/?q=mecha&sort=trending");
});

/* ── previews ───────────────────────────────────────────────────────────── */

test("thumbRows labels rows from the top tier down and caps at six", () => {
  const rows = thumbRows([[1], [2], [3], [4], [5], [6], [7]]);
  assert.deepEqual(
    rows.map((r) => r.label),
    ["S", "A", "B", "C", "D", "F"],
  );
  assert.equal(rows[0].cells.length, 1);
  assert.match(rows[0].cells[0], /^linear-gradient\(155deg, hsl\(1 /);
  // Distinct tier colours, so a preview never renders as one block.
  assert.equal(new Set(rows.map((r) => r.color)).size, 6);
});

test("titleCount sums every row", () => {
  assert.equal(titleCount(post("a", { spec: [[1, 2], [3], []] })), 3);
});

/* ── sample content ─────────────────────────────────────────────────────── */

test("sample posts are well-formed", () => {
  assert.equal(new Set(FEED_POSTS.map((p) => p.id)).size, FEED_POSTS.length);
  for (const p of FEED_POSTS) {
    assert.ok(p.title && p.excerpt, `${p.id} needs a title and an excerpt`);
    assert.ok(p.handle.startsWith("@"), `${p.id} handle should start with @`);
    assert.ok(titleCount(p) > 0, `${p.id} needs at least one title on the board`);
  }
  assert.ok(
    FEED_POSTS.some((p) => p.featured),
    "the featured strip would be empty",
  );
});
