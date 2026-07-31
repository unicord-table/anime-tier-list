"use client";

import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { Trash } from "@phosphor-icons/react";

import { DropRegion, SortableBoardCard } from "@/components/dnd/DragParts";
import { TierColorPicker } from "./TierColorPicker";
import { IconButton } from "@/components/ui/IconButton";
import { Text } from "@/components/ui/Text";
import { TextInput } from "@/components/ui/TextInput";
import type { Media, MediaKey, Tier } from "@/lib/types";

type TierRowProps = {
  tier: Tier;
  media: Record<MediaKey, Media>;
  onRename: (id: string, label: string) => void;
  onRecolor: (id: string, color: string) => void;
  onRemove: (id: string) => void;
  onOpenCard: (media: Media) => void;
};

export function TierRow({
  tier,
  media,
  onRename,
  onRecolor,
  onRemove,
  onOpenCard,
}: TierRowProps) {
  const region = `tier:${tier.id}` as const;
  const items = tier.items.filter((key) => media[key]);

  return (
    <div className="mb-[11px] flex rounded-[10px] shadow-[0_0_0_1px_var(--color-neutral-800)]">
      <div
        style={{ background: tier.color }}
        className="relative flex w-[88px] min-h-[104px] flex-none flex-col items-center justify-center rounded-l-[10px] px-[4px] py-[8px]"
      >
        <TextInput
          variant="tier"
          value={tier.label}
          aria-label="Tier label"
          onChange={(e) => onRename(tier.id, e.target.value)}
        />
        <div className="mt-[6px] flex gap-[2px]">
          <TierColorPicker
            tierLabel={tier.label}
            onPick={(color) => onRecolor(tier.id, color)}
          />
          <IconButton
            size="sm"
            tone="onTier"
            title={`Delete tier ${tier.label}`}
            icon={<Trash />}
            onClick={() => onRemove(tier.id)}
          />
        </div>
      </div>

      <DropRegion
        region={region}
        className="flex min-w-0 flex-1 flex-wrap content-start gap-[9px] rounded-r-[10px] bg-surface p-[9px]"
      >
        <SortableContext items={items} strategy={rectSortingStrategy}>
          {items.map((key) => (
            <SortableBoardCard
              key={key}
              media={media[key]}
              region={region}
              size="tier"
              onOpen={onOpenCard}
            />
          ))}
        </SortableContext>

        {items.length === 0 ? (
          <Text
            variant="label"
            tone="muted"
            className="flex h-[88px] items-center px-[6px]"
          >
            Drop titles here
          </Text>
        ) : null}
      </DropRegion>
    </div>
  );
}
