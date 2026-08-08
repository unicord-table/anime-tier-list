"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";

const url = process.env.NEXT_PUBLIC_CONVEX_URL;

/**
 * Null when no deployment is configured.
 *
 * Sign-in is additive — the board still lives in localStorage and the catalog
 * still talks to AniList direct — so a missing URL hides the account UI rather
 * than white-screening the app for anyone who cloned the repo without Convex.
 * Every consumer of Convex hooks must check this first: the hooks throw
 * without a provider above them.
 */
export const convex = url ? new ConvexReactClient(url) : null;

/**
 * `@convex-dev/auth/react` rather than `/nextjs`: nothing here is
 * server-rendered (see .docs/04-decisions.md D11), so the cookie + middleware
 * setup would buy nothing.
 */
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!convex) return <>{children}</>;
  return <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>;
}
