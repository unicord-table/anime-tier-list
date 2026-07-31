"use client";

import dynamic from "next/dynamic";
import { Text } from "@/components/ui/Text";

/**
 * The editor is a browser-only app: its state comes from localStorage and its
 * data from AniList over fetch. Rendering it on the server would produce markup
 * the client immediately contradicts, so it is mounted with ssr:false — which
 * also lets useTierList read localStorage straight from a useState initialiser
 * instead of hydrating through an effect.
 */
const TierListApp = dynamic(
  () => import("./TierListApp").then((m) => ({ default: m.TierListApp })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <Text variant="label" tone="muted">
          Loading your board…
        </Text>
      </div>
    ),
  },
);

export function TierListShell() {
  return <TierListApp />;
}
