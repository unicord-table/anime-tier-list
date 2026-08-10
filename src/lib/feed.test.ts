import { strict as assert } from "node:assert";
import test from "node:test";

import { feedHref } from "./feed.ts";

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
