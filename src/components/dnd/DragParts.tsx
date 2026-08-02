"use client";

import type { ReactNode } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { AnimeCard, type AnimeCardSize } from "@/components/anime/AnimeCard";
import { cn } from "@/lib/cn";
import type { Media, Region } from "@/lib/types";

/**
 * dnd-kit wiring, kept away from the presentational components so AnimeCard
 * stays a plain tile.
 *
 * Two kinds of draggable exist:
 *  - catalog results, which *copy* onto the board (`type: "catalog"`)
 *  - board tiles, which *move* between regions (`type: "board"`)
 * `onDragEnd` in BoardEditor branches on that `type`.
 */

export type DragData =
  | { type: "catalog"; media: Media }
  | { type: "board"; key: string; region: Region }
  | { type: "tier"; id: string };

/** Sortable id for a tier row. Namespaced so it can't collide with a MediaKey. */
export const tierSortId = (id: string) => `tiersort:${id}`;

export type DropData = { type: "region"; region: Region };

/** A search result. Drags a copy; the result itself stays in the list. */
export function DraggableCatalogCard({
  media,
  onOpen,
  onBoard,
}: {
  media: Media;
  onOpen: (media: Media) => void;
  onBoard: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `catalog:${media.key}`,
    data: { type: "catalog", media } satisfies DragData,
  });

  return (
    <AnimeCard
      ref={setNodeRef}
      media={media}
      size="catalog"
      onOpen={onOpen}
      onBoard={onBoard}
      dragging={isDragging}
      {...attributes}
      {...listeners}
    />
  );
}

/** A tile already on the board. Sortable within its region and across regions. */
export function SortableBoardCard({
  media,
  region,
  size,
  onOpen,
}: {
  media: Media;
  region: Region;
  size: AnimeCardSize;
  onOpen: (media: Media) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: media.key,
      data: { type: "board", key: media.key, region } satisfies DragData,
    });

  return (
    <AnimeCard
      ref={setNodeRef}
      media={media}
      size={size}
      onOpen={onOpen}
      dragging={isDragging}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
    />
  );
}

/** Any surface a tile can be dropped onto: a tier row, or the pool. */
export function DropRegion({
  region,
  children,
  className,
  activeClassName = "drop-active",
  style,
}: {
  region: Region;
  children: ReactNode;
  className?: string;
  activeClassName?: string;
  style?: React.CSSProperties;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: region,
    data: { type: "region", region } satisfies DropData,
  });

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(className, isOver && activeClassName)}
    >
      {children}
    </div>
  );
}
