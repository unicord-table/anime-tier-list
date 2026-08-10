import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

/**
 * `authTables.users` already carries name / image / email and `authAccounts`
 * carries the provider, so there is nothing to add for a profile.
 *
 * `tierlists` is the published board. The editor still autosaves to
 * `localStorage` — publishing is an explicit act, not a sync — so a document
 * here is a snapshot the owner chose to put a URL on.
 */

/** Mirrors `Media` in src/lib/types.ts. */
const mediaValidator = v.object({
  key: v.string(),
  source: v.union(v.literal("anilist"), v.literal("mal")),
  id: v.number(),
  idMal: v.union(v.number(), v.null()),
  title: v.string(),
  titleEn: v.union(v.string(), v.null()),
  cover: v.string(),
  year: v.union(v.number(), v.null()),
  format: v.union(v.string(), v.null()),
  color: v.optional(v.union(v.string(), v.null())),
});

/**
 * Mirrors `SaveFile`. Stored whole rather than normalised into tables: it is
 * one user's snapshot, read all at once, written all at once, and capped well
 * under the document limit by `prepareBoard`. Splitting it would buy nothing
 * and cost the "one DB read renders the page" property.
 */
export const saveFileValidator = v.object({
  schema: v.literal(1),
  title: v.string(),
  updatedAt: v.string(),
  tiers: v.array(
    v.object({
      id: v.string(),
      label: v.string(),
      color: v.string(),
      items: v.array(v.string()),
    }),
  ),
  pool: v.array(v.string()),
  media: v.record(v.string(), mediaValidator),
});

/** Denormalized card thumbnail — see `previewOf` in src/lib/publish.ts. */
export const previewValidator = v.array(
  v.object({
    label: v.string(),
    color: v.string(),
    swatches: v.array(v.string()),
  }),
);

export const visibilityValidator = v.union(
  v.literal("public"),
  v.literal("unlisted"),
  v.literal("private"),
);

export default defineSchema({
  ...authTables,

  tierlists: defineTable({
    ownerId: v.id("users"),
    /** `nanoid(10)`, minted server-side. The share link is `/t/{slug}`. */
    slug: v.string(),
    title: v.string(),
    description: v.string(),
    visibility: visibilityValidator,
    data: saveFileValidator,
    preview: previewValidator,
    itemCount: v.number(),
    tierCount: v.number(),
    /** Last edit. `_creationTime` is the publish date the feed orders by. */
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_owner", ["ownerId"])
    // Convex appends `_creationTime` to every index, so `.order("desc")` here
    // is "newest public boards first" with no re-sort in JavaScript.
    .index("by_visibility", ["visibility"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["visibility"],
    }),
});
