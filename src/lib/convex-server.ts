import { fetchQuery } from "convex/nextjs";
import type {
  FunctionArgs,
  FunctionReference,
  FunctionReturnType,
} from "convex/server";

/**
 * One-shot Convex reads from a server component.
 *
 * Two rules this exists to enforce, both app-wide:
 *
 * - **`NEXT_PUBLIC_CONVEX_URL` may be unset.** Someone who clones the repo gets
 *   a working editor with no backend, so a server page must render without one
 *   rather than throw at build time.
 * - **A backend hiccup must not 500 the landing page.** A feed that renders its
 *   empty state is a better failure than an error page; the cause still goes to
 *   the server log.
 *
 * No token is attached, so these run as an anonymous reader. That is deliberate:
 * it keeps the app on `@convex-dev/auth/react` instead of forcing the `/nextjs`
 * migration (decisions.md D11). Anything viewer-specific stays client-side.
 */

export const convexConfigured = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function serverQuery<Query extends FunctionReference<"query">>(
  reference: Query,
  args: FunctionArgs<Query>,
): Promise<FunctionReturnType<Query> | null> {
  if (!convexConfigured) return null;
  try {
    return await fetchQuery(reference, args);
  } catch (err) {
    console.error(`Convex server query failed: ${describe(err)}`);
    return null;
  }
}

/**
 * The overwhelmingly common cause is a deployment that has the types but not
 * the functions — `npx convex codegen` writes `_generated/` without pushing,
 * so `api.tierlists.feed` typechecks against a backend that has never seen it.
 * Say so, rather than printing a stack that points at `fetchQuery`.
 */
function describe(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  return /Could not find public function/.test(message)
    ? `${message.trim()} — the functions in convex/ are not on this deployment. Run \`npx convex dev\` to push them.`
    : message;
}
