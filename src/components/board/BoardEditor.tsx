"use client";

import { useState, type RefObject } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type Over,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Plus } from "@phosphor-icons/react";

import { AnimeCard } from "@/components/anime/AnimeCard";
import { CatalogPanel } from "@/components/catalog/CatalogPanel";
import type { DragData } from "@/components/dnd/DragParts";
import { Text } from "@/components/ui/Text";
import type { Media, Region } from "@/lib/types";
import type { TierListStore } from "@/lib/useTierList";

import { TierRow } from "./TierRow";
import { ToolRail } from "./ToolRail";
import { UnrankedPool } from "./UnrankedPool";

/** Where a drop landed: which region, and at which slot within it. */
function resolveTarget(over: Over): { region: Region; index: number | null } | null {
  const data = over.data.current as
    | { type?: string; region?: Region; sortable?: { index: number } }
    | undefined;

  if (data?.type === "region" && data.region) {
    return { region: data.region, index: null };
  }
  // Dropped onto another tile — take that tile's slot.
  if (data?.type === "board" && data.region) {
    return { region: data.region, index: data.sortable?.index ?? null };
  }
  return null;
}

export function BoardEditor({
  store,
  boardRef,
  onOpenCard,
  onError,
  onImported,
  onExportPng,
  onSaveJson,
  onLoadJson,
}: {
  store: TierListStore;
  boardRef: RefObject<HTMLDivElement | null>;
  onOpenCard: (media: Media) => void;
  onError: (message: string) => void;
  onImported: (count: number) => void;
  onExportPng: () => void;
  onSaveJson: () => void;
  onLoadJson: () => void;
}) {
  const [dragging, setDragging] = useState<Media | null>(null);
  const { save } = store;

  const sensors = useSensors(
    // A 6px threshold keeps a plain click a click, so tapping a card still
    // opens the detail modal instead of starting a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      // Space drives the drag so Enter stays free to open details.
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space"] },
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragStart({ active }: DragStartEvent) {
    const data = active.data.current as DragData | undefined;
    if (!data) return;
    setDragging(data.type === "catalog" ? data.media : (save.media[data.key] ?? null));
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setDragging(null);
    if (!over) return;

    const target = resolveTarget(over);
    const data = active.data.current as DragData | undefined;
    if (!target || !data) return;

    if (data.type === "catalog") {
      store.addMedia(data.media, target.region, target.index);
    } else {
      store.moveItem(data.key, target.region, target.index);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDragging(null)}
    >
      <div className="flex min-h-0 flex-1">
        <CatalogPanel
          placed={store.placed}
          onOpenCard={onOpenCard}
          onError={onError}
          onImport={(list) => {
            store.addManyToPool(list);
            onImported(list.length);
          }}
        />

        <main className="flex min-w-0 flex-1">
          <ToolRail
            canUndo={store.canUndo}
            canRedo={store.canRedo}
            onAddTier={store.addTier}
            onUndo={store.undo}
            onRedo={store.redo}
            onExportPng={onExportPng}
            onSaveJson={onSaveJson}
            onLoadJson={onLoadJson}
          />

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="scrollbar flex-1 overflow-x-hidden overflow-y-auto px-[18px] pt-[16px] pb-[8px]">
              {/* Ref sits on the inner wrapper so the PNG captures every tier,
                  not just the scrolled-into-view slice. */}
              <div ref={boardRef} className="bg-canvas">
                {save.tiers.map((tier) => (
                  <TierRow
                    key={tier.id}
                    tier={tier}
                    media={save.media}
                    onRename={store.renameTier}
                    onRecolor={store.recolorTier}
                    onRemove={store.removeTier}
                    onOpenCard={onOpenCard}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={store.addTier}
                className="my-[3px] mb-[6px] flex w-full cursor-pointer items-center justify-center gap-[8px] rounded-[10px] border border-dashed border-neutral-700 bg-transparent p-[11px] text-neutral-400 transition-colors hover:border-accent hover:text-accent-300"
              >
                <Plus weight="bold" size={15} />
                <Text variant="uiSm" tone="inherit">
                  Add tier
                </Text>
              </button>
            </div>

            <UnrankedPool
              pool={save.pool}
              media={save.media}
              onOpenCard={onOpenCard}
            />
          </div>
        </main>
      </div>

      <DragOverlay dropAnimation={null}>
        {dragging ? (
          <AnimeCard
            media={dragging}
            size="tier"
            interactive={false}
            className="rotate-[3deg] shadow-lg"
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
