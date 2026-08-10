import type { Metadata } from "next";

import { TierListShell } from "@/components/TierListShell";

export const metadata: Metadata = {
  title: "Tier list editor — Unicord",
  description:
    "Drag anime into tiers, search AniList or import a public list, and export a PNG or a save file.",
};

/**
 * The editor. It was the root route until the newsfeed landing page took `/`;
 * nothing else moved, and `/` still resolves, so no old link 404s.
 *
 * Phase 1 is entirely client-side: the board lives in localStorage and the
 * catalog talks to AniList straight from the browser. This route is just the
 * mount point.
 */
export default function TierListPage() {
  return <TierListShell />;
}
