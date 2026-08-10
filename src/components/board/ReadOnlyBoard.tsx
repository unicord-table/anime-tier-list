import type { Ref } from "react";

import { AnimeCard } from "@/components/anime/AnimeCard";
import { Text } from "@/components/ui/Text";
import type { SaveFile } from "@/lib/types";

/**
 * A board with no editor attached. Used by the in-app preview and by the
 * published page at `/t/[slug]`.
 *
 * Deliberately not `BoardEditor`: the public page must not ship `@dnd-kit` or
 * `html-to-image`, and it makes zero catalog API calls — titles and cover URLs
 * are denormalized into the save file precisely so one read renders the page.
 *
 * No `"use client"`. Imported from a client component it compiles as one (and
 * takes `ref` for the PNG export); imported from a server component it stays on
 * the server.
 */
export function ReadOnlyBoard({
  save,
  ref,
}: {
  save: SaveFile;
  ref?: Ref<HTMLDivElement>;
}) {
  return (
    <div ref={ref} className="bg-canvas">
      {save.tiers.map((tier) => (
        <div
          key={tier.id}
          className="mb-[11px] flex rounded-[10px] shadow-[0_0_0_1px_var(--color-neutral-800)]"
        >
          <div
            style={{ background: tier.color }}
            className="flex min-h-[104px] w-[88px] flex-none items-center justify-center rounded-l-[10px] p-[8px]"
          >
            <Text variant="tierLabelLg" tone="onTier">
              {tier.label}
            </Text>
          </div>
          <div className="flex min-w-0 flex-1 flex-wrap content-start gap-[9px] rounded-r-[10px] bg-surface p-[9px]">
            {tier.items
              .filter((key) => save.media[key])
              .map((key) => (
                <AnimeCard
                  key={key}
                  media={save.media[key]}
                  size="public"
                  interactive={false}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
