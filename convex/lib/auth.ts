import { ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

/**
 * Every write starts with one of these. A per-function reimplementation is how
 * an authorization hole gets in — see .docs/architecture/social-feed.md.
 *
 * The user id is always derived from the request's identity, never taken as an
 * argument: an argument is something the caller chooses.
 */

export async function requireUser(ctx: QueryCtx | MutationCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new ConvexError("Sign in to do that");
  return userId;
}

/** The board, but only if the caller owns it. */
export async function requireOwnedBoard(
  ctx: MutationCtx,
  id: Id<"tierlists">,
): Promise<{ userId: Id<"users">; board: Doc<"tierlists"> }> {
  const userId = await requireUser(ctx);
  const board = await ctx.db.get(id);
  // Same error either way: "no such board" and "not yours" must not be
  // distinguishable, or the id space becomes an existence oracle.
  if (board === null || board.ownerId !== userId) {
    throw new ConvexError("That tier list doesn't exist, or isn't yours");
  }
  return { userId, board };
}
