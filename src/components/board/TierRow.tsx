"use client";

import { SortableContext, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DotsSixVertical, Trash } from "@phosphor-icons/react";

import {
  DropRegion,
  SortableBoardCard,
  tierSortId,
  type DragData,
} from "@/components/dnd/DragParts";
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
  /** `delta` is -1 (up) or +1 (down). */
  onMove: (id: string, delta: number) => void;
  onOpenCard: (media: Media) => void;
};

export function TierRow({
  tier,
  media,
  onRename,
  onRecolor,
  onRemove,
  onMove,
  onOpenCard,
}: TierRowProps) {
  const region = `tier:${tier.id}` as const;
  const items = tier.items.filter((key) => media[key]);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: tierSortId(tier.id),
      data: { type: "tier", id: tier.id } satisfies DragData,
    });

  const dragListeners = { ...listeners };
  delete dragListeners.onKeyDown;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : undefined,
      }}
      className="mb-[11px] flex rounded-[10px] shadow-[0_0_0_1px_var(--color-neutral-800)]"
    >
      <div
        style={{ background: tier.color }}
        className="relative flex w-[88px] min-h-[104px] flex-none flex-col items-center justify-center rounded-l-[10px] px-[4px] py-[8px]"
      >
        <button
          type="button"
          aria-label={`Reorder tier ${tier.label}: drag, or press arrow up / arrow down`}
          className="absolute top-[3px] left-[3px] cursor-grab touch-none text-black/45 hover:text-black/75 focus-visible:text-black/75"
          {...attributes}
          {...dragListeners}
          // dnd-kit's keyboard sensor is useless here: sortableKeyboardCoordinates
          // scans every droppable in the context, so arrow keys land on a card
          // region inside the tier instead of the next tier. A plain arrow-key
          // handler is both smaller and the behaviour the a11y guidance asks for.
          onKeyDown={(e) => {
            const delta = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
            if (!delta) return;
            e.preventDefault();
            onMove(tier.id, delta);
          }}
        >
          <DotsSixVertical weight="bold" size={14} />
        </button>

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
