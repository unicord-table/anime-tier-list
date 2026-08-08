import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";

/**
 * The signed-in user, or null. Null rather than a throw: this is the query the
 * UI asks "am I signed in?" with, and signed-out is a normal answer.
 *
 * Anything that writes should instead throw on a null id — see docs/auth.md.
 */
export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const user = await ctx.db.get(userId);
    if (user === null) return null;

    // A user can link several providers; the first one is only used to label
    // the account menu, so which one it is doesn't matter.
    const account = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
      .first();

    return {
      id: user._id,
      name: user.name ?? user.email ?? "Account",
      email: user.email ?? null,
      image: user.image ?? null,
      provider: account?.provider ?? null,
    };
  },
});
