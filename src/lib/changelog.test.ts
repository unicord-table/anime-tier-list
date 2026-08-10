import { strict as assert } from "node:assert";
import test from "node:test";

import {
  anchorOf,
  asFilter,
  CHANGELOG,
  commitUrl,
  entriesFor,
  jumpTargets,
} from "./changelog.ts";

/** Run with: npm test */

test("every entry is complete, and a commit hash looks like one", () => {
  for (const entry of CHANGELOG) {
    assert.ok(entry.date && entry.phase && entry.title && entry.body, `${entry.title} is thin`);
    assert.ok(["Shipped", "Fix", "Correction"].includes(entry.kind));
    if (entry.commit) assert.match(entry.commit, /^[0-9a-f]{7,40}$/);
  }
});

test("`?kind=` falls back to everything rather than emptying the page", () => {
  assert.equal(asFilter("Fix"), "Fix");
  assert.equal(asFilter("all"), "all");
  assert.equal(asFilter("shipped"), "all"); // case matters — near-misses are not kinds
  assert.equal(asFilter(["Fix"]), "all"); // ?kind=a&kind=b arrives as an array
  assert.equal(asFilter(undefined), "all");
});

test("a filter keeps only its own kind, and `all` keeps the lot", () => {
  assert.equal(entriesFor("all").length, CHANGELOG.length);
  assert.ok(entriesFor("Fix").length > 0);
  assert.ok(entriesFor("Fix").every((e) => e.kind === "Fix"));
});

test("anchors are unique and survive filtering", () => {
  const anchors = CHANGELOG.map(anchorOf);
  assert.equal(new Set(anchors).size, anchors.length);
  // The same entry keeps its anchor under a filter, so a deep link still lands.
  const fix = entriesFor("Fix")[0];
  assert.equal(anchorOf(fix), `entry-${CHANGELOG.indexOf(fix)}`);
});

test("jump links point at visible entries only, one per phase", () => {
  const visible = entriesFor("Correction");
  const anchors = new Set(visible.map((e) => `#${anchorOf(e)}`));
  const targets = jumpTargets(visible);
  assert.equal(new Set(targets.map((t) => t.label)).size, targets.length);
  for (const target of targets) assert.ok(anchors.has(target.href), `${target.href} is hidden`);
});

test("commit links point at this repo", () => {
  assert.equal(
    commitUrl("f3972d2"),
    "https://github.com/unicord-table/anime-tier-list/commit/f3972d2",
  );
});
