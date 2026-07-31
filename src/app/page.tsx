import { TierListShell } from "@/components/TierListShell";

/**
 * Phase 1 is entirely client-side: the board lives in localStorage and the
 * catalog talks to AniList straight from the browser. This route is just the
 * mount point.
 */
export default function Home() {
  return <TierListShell />;
}
