import { strict as assert } from "node:assert";
import test from "node:test";

import { ANNOUNCEMENTS, feedHref } from "./feed.ts";

/** Run with: npm test */

test("feedHref omits an empty query so `/` stays canonical", () => {
  assert.equal(feedHref(), "/");
  assert.equal(feedHref(""), "/");
  assert.equal(feedHref("   "), "/");
});

test("feedHref escapes the query rather than pasting it into the URL", () => {
  assert.equal(feedHref("mecha"), "/?q=mecha");
  assert.equal(feedHref(" mecha "), "/?q=mecha");
  assert.equal(feedHref("best & worst"), "/?q=best%20%26%20worst");
});

test("every announcement is complete", () => {
  for (const item of ANNOUNCEMENTS) {
    assert.ok(item.date && item.title && item.body, `${item.title} is missing a field`);
    assert.ok(["Shipped", "Planned"].includes(item.kind));
  }
});
