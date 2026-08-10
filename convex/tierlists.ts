import { ConvexError, v } from "convex/values";
import { paginationOptsValidator, paginationResultValidator } from "convex/server";
import { nanoid } from "nanoid";
import { getAuthUserId } from "@convex-dev/auth/server";

import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { requireOwnedBoard, requireUser } from "./lib/auth";
import { previewValidator, saveFileValidator, visibilityValidator } from "./schema";
import {
  LIMITS,
  PublishError,
  prepareBoard,
  sanitizeText,
} from "../src/lib/publish";

/**
 * Published boards.
 *
 * The caps, the sanitiser and the image allowlist live in `src/lib/publish.ts`
 * and are imported here rather than reimplemented, so the editor can warn about
 * exactly what the server will reject.
 */

const FEED_LIMIT = { default: 12, max: 48 };

/**
 * The card payload. Fields are listed one by one on purpose: spreading the
 * document would ship the whole `data` blob to every listing, and the owner's
 * email with it. The validator is what enforces that.
 */
const summaryValidator = v.object({
  id: v.id("tierlists"),
  slug: v.string(),
  title: v.string(),
  description: v.string(),
  visibility: visibilityValidator,
  preview: previewValidator,
  itemCount: v.number(),
  tierCount: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
  author: v.object({ name: v.string(), image: v.union(v.string(), v.null()) }),
});

export type BoardSummary = typeof summaryValidator.type;

/**
 * `prepareBoard` throws a plain Error, whose message Convex hides in
 * production. These are all user-fixable, so re-throw them as `ConvexError` to
 * get the message across the wire.
 */
function prepare(data: unknown) {
  try {
    return prepareBoard(data);
  } catch (err) {
    if (err instanceof PublishError) throw new ConvexError(err.message);
    throw err;
  }
}

async function mintSlug(ctx: MutationCtx): Promise<string> {
  // nanoid(10) is ~10^18 of space; the check is here because a silent slug
  // collision would hand one user another user's board.
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = nanoid(10);
    const clash = await ctx.db
      .query("tierlists")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (clash === null) return slug;
  }
  throw new ConvexError("Couldn't allocate a share link — try again");
}

async function summarize(
  ctx: QueryCtx,
  board: Doc<"tierlists">,
): Promise<BoardSummary> {
  const owner = await ctx.db.get(board.ownerId);
  return {
    id: board._id,
    slug: board.slug,
    title: board.title,
    description: board.description,
    visibility: board.visibility,
    preview: board.preview,
    itemCount: board.itemCount,
    tierCount: board.tierCount,
    createdAt: board._creationTime,
    updatedAt: board.updatedAt,
    author: {
      name: owner?.name ?? "Someone",
      image: owner?.image ?? null,
    },
  };
}

/* ── writes ─────────────────────────────────────────────────────────────── */

export const publish = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    visibility: visibilityValidator,
    data: saveFileValidator,
  },
  returns: v.object({ id: v.id("tierlists"), slug: v.string() }),
  handler: async (ctx, args) => {
    const ownerId = await requireUser(ctx);
    const prepared = prepare(args.data);
    const slug = await mintSlug(ctx);

    const id = await ctx.db.insert("tierlists", {
      ownerId,
      slug,
      title: sanitizeText(args.title, LIMITS.title) || prepared.data.title,
      description: sanitizeText(args.description, LIMITS.description),
      visibility: args.visibility,
      data: prepared.data,
      preview: prepared.preview,
      itemCount: prepared.itemCount,
      tierCount: prepared.data.tiers.length,
      updatedAt: Date.now(),
    });

    return { id, slug };
  },
});

export const update = mutation({
  args: {
    id: v.id("tierlists"),
    title: v.string(),
    description: v.string(),
    visibility: visibilityValidator,
    /** Omitted when only the metadata changed — renaming shouldn't reupload. */
    data: v.optional(saveFileValidator),
  },
  returns: v.object({ slug: v.string() }),
  handler: async (ctx, args) => {
    const { board } = await requireOwnedBoard(ctx, args.id);
    const prepared = args.data === undefined ? null : prepare(args.data);

    await ctx.db.patch(args.id, {
      title: sanitizeText(args.title, LIMITS.title) || board.title,
      description: sanitizeText(args.description, LIMITS.description),
      visibility: args.visibility,
      updatedAt: Date.now(),
      ...(prepared
        ? {
            data: prepared.data,
            preview: prepared.preview,
            itemCount: prepared.itemCount,
            tierCount: prepared.data.tiers.length,
          }
        : {}),
    });

    return { slug: board.slug };
  },
});

export const remove = mutation({
  args: { id: v.id("tierlists") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireOwnedBoard(ctx, args.id);
    await ctx.db.delete(args.id);
    return null;
  },
});

/* ── reads ──────────────────────────────────────────────────────────────── */

export const bySlug = query({
  args: { slug: v.string() },
  returns: v.union(
    v.null(),
    summaryValidator.extend({ data: saveFileValidator, isOwner: v.boolean() }),
  ),
  handler: async (ctx, args) => {
    const board = await ctx.db
      .query("tierlists")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (board === null) return null;

    const userId: Id<"users"> | null = await getAuthUserId(ctx);
    const isOwner = userId !== null && userId === board.ownerId;
    if (board.visibility === "private" && !isOwner) return null;

    // `isOwner` is what lets the editor decide between "update this board" and
    // "remix it as mine". It is always false on the server-rendered `/t/[slug]`,
    // which reads anonymously — that page has no owner-only affordance.
    return { ...(await summarize(ctx, board)), data: board.data, isOwner };
  },
});

/** The signed-in user's own boards, newest first. Empty when signed out. */
export const mine = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(summaryValidator),
  handler: async (ctx, args) => {
    const ownerId = await getAuthUserId(ctx);
    if (ownerId === null) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    const result = await ctx.db
      .query("tierlists")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .order("desc")
      .paginate(args.paginationOpts);

    return {
      ...result,
      page: await Promise.all(result.page.map((board) => summarize(ctx, board))),
    };
  },
});

/**
 * The landing-page feed: public boards only, reverse-chronological. Not an
 * algorithm — see .docs/architecture/social-feed.md#ranking.
 *
 * `query` searches titles. Descriptions are not indexed; add a second search
 * index if anyone asks for it.
 */
export const feed = query({
  args: { query: v.optional(v.string()), limit: v.optional(v.number()) },
  returns: v.array(summaryValidator),
  handler: async (ctx, args) => {
    const limit = Math.min(
      Math.max(1, Math.floor(args.limit ?? FEED_LIMIT.default)),
      FEED_LIMIT.max,
    );
    const search = args.query?.trim();

    const boards = search
      ? await ctx.db
          .query("tierlists")
          .withSearchIndex("search_title", (q) =>
            q.search("title", search).eq("visibility", "public"),
          )
          .take(limit)
      : await ctx.db
          .query("tierlists")
          .withIndex("by_visibility", (q) => q.eq("visibility", "public"))
          .order("desc")
          .take(limit);

    return Promise.all(boards.map((board) => summarize(ctx, board)));
  },
});
