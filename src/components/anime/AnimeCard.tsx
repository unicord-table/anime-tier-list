"use client";

import type { CSSProperties, HTMLAttributes, Ref } from "react";
import { Check } from "@phosphor-icons/react";
import { Text } from "@/components/ui/Text";
import { cn } from "@/lib/cn";
import type { Media } from "@/lib/types";

/**
 * One cover tile. The four sizes are the ones the design uses: the catalog
 * grid, a tier row, the unranked pool, and the read-only public board.
 */

const SIZES = {
  catalog: "aspect-[2/3] w-full rounded-[7px]",
  tier: "h-[88px] w-[60px] rounded-[6px]",
  pool: "h-[84px] w-[58px] flex-none rounded-[6px]",
  public: "h-[94px] w-[64px] rounded-[6px]",
} as const;

export type AnimeCardSize = keyof typeof SIZES;

/** Seeds a readable gradient from AniList's dominant cover colour. */
function placeholder(media: Media): string {
  const base = media.color ?? "#3f424d";
  return `linear-gradient(155deg, ${base}, color-mix(in srgb, ${base} 35%, #11121e))`;
}

type AnimeCardProps = {
  media: Media;
  size?: AnimeCardSize;
  onOpen?: (media: Media) => void;
  /** Catalog only — marks a title already placed on the board. */
  onBoard?: boolean;
  dragging?: boolean;
  interactive?: boolean;
  ref?: Ref<HTMLDivElement>;
  style?: CSSProperties;
} & Omit<HTMLAttributes<HTMLDivElement>, "onDrag" | "style">;

export function AnimeCard({
  media,
  size = "tier",
  onOpen,
  onBoard = false,
  dragging = false,
  interactive = true,
  className,
  style,
  ref,
  ...rest
}: AnimeCardProps) {
  const showMeta = size === "catalog";

  return (
    <div
      ref={ref}
      style={{ background: placeholder(media), ...style }}
      className={cn(
        "relative overflow-hidden select-none",
        "shadow-[0_0_0_1px_rgba(0,0,0,.45),0_3px_8px_rgba(0,0,0,.4)]",
        SIZES[size],
        interactive && "cursor-grab active:cursor-grabbing",
        dragging && "opacity-40",
        className,
      )}
      // Enter opens details. The keyboard drag sensor is bound to Space only,
      // so the two never fight over the same key.
      onKeyDown={(e) => {
        if (e.key === "Enter" && onOpen) {
          e.preventDefault();
          onOpen(media);
        }
      }}
      onClick={() => onOpen?.(media)}
      {...rest}
    >
      {media.cover ? (
        // Plain <img>: AniList's CDN already serves correctly-sized covers, so
        // next/image would add an optimizer hop and a remotePatterns entry for
        // no gain. See .docs/04-decisions.md#d6.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={media.cover}
          alt=""
          loading="lazy"
          draggable={false}
          // AniList's CDN reflects Origin, so an anonymous request keeps the
          // canvas untainted — without this the PNG export fails.
          crossOrigin="anonymous"
          className="h-full w-full object-cover"
        />
      ) : null}

      {showMeta && media.format ? (
        <Text
          variant="micro"
          className="absolute top-[5px] left-[5px] rounded-[4px] bg-[rgba(18,20,32,.6)] px-[5px] py-[2px] tracking-[.04em] text-card-ink"
        >
          {media.format}
        </Text>
      ) : null}

      {onBoard ? (
        <span
          title="Already on your board"
          className="absolute top-[5px] right-[5px] flex h-[18px] w-[18px] items-center justify-center rounded-full bg-accent-600 text-canvas"
        >
          <Check weight="bold" size={11} />
        </span>
      ) : null}

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-[linear-gradient(transparent,rgba(11,12,20,.92))]",
          showMeta ? "px-[7px] pt-[16px] pb-[6px]" : "px-[5px] pt-[12px] pb-[4px]",
        )}
      >
        <Text
          variant="micro"
          tone="card"
          clamp={showMeta ? 2 : 3}
          className={showMeta ? "text-[11px] leading-[1.15]" : undefined}
        >
          {media.title}
        </Text>
        {showMeta && media.year ? (
          <Text variant="micro" tone="cardDim" className="mt-[1px] font-normal">
            {media.year}
          </Text>
        ) : null}
      </div>
    </div>
  );
}
