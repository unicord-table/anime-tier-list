"use client";

import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { Stack } from "@phosphor-icons/react";

import { DropRegion, SortableBoardCard } from "@/components/dnd/DragParts";
import { SectionLabel, Text } from "@/components/ui/Text";
import type { Media, MediaKey } from "@/lib/types";

export function UnrankedPool({
  pool,
  media,
  onOpenCard,
}: {
  pool: MediaKey[];
  media: Record<MediaKey, Media>;
  onOpenCard: (media: Media) => void;
}) {
  const items = pool.filter((key) => media[key]);

  return (
    <section className="flex-none border-t border-divider bg-canvas px-[18px] pt-[11px] pb-[14px]">
      <div className="mb-[9px] flex items-center gap-[8px]">
        <Stack size={15} className="text-neutral-400" />
        <SectionLabel>Unranked pool</SectionLabel>
        <Text variant="caption" tone="muted">
          {items.length} waiting
        </Text>
      </div>

      <DropRegion
        region="pool"
        className="scrollbar flex min-h-[96px] gap-[9px] overflow-x-auto rounded-[9px] border border-dashed border-neutral-800 p-[4px]"
      >
        <SortableContext items={items} strategy={horizontalListSortingStrategy}>
          {items.map((key) => (
            <SortableBoardCard
              key={key}
              media={media[key]}
              region="pool"
              size="pool"
              onOpen={onOpenCard}
            />
          ))}
        </SortableContext>

        {items.length === 0 ? (
          <Text
            variant="label"
            tone="muted"
            className="flex h-[84px] items-center px-[10px]"
          >
            Nothing here — drag titles down from the tiers, or add from the catalog.
          </Text>
        ) : null}
      </DropRegion>
    </section>
  );
}
