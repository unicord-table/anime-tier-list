import { Text } from "@/components/ui/Text";
import { cn } from "@/lib/cn";
import { coverGradient } from "@/lib/img";
import type { PreviewRow } from "@/lib/publish";

/**
 * The miniature board on a feed or listing card, rendered from the `preview`
 * denormalized onto the document at publish time — real tiers, real cover
 * colours, no image requests and no second read.
 *
 * Decorative: it always sits next to the board's real title, so it is hidden
 * from assistive tech rather than announced as a wall of unlabelled swatches.
 */

const SIZES = {
  md: {
    gap: "gap-[5px]",
    label: "w-[24px] rounded-[5px]",
    track:
      "flex min-w-0 flex-1 gap-[4px] rounded-[5px] p-[4px] bg-[color-mix(in_srgb,var(--color-canvas)_72%,transparent)]",
    cell: "h-[25px] w-[17px]",
  },
  sm: {
    gap: "gap-[4px]",
    label: "w-[20px] rounded-[4px]",
    track: "flex min-w-0 flex-1 gap-[3px]",
    cell: "h-[22px] w-[15px]",
  },
} as const;

export function BoardThumb({
  rows,
  size = "md",
  className,
}: {
  rows: readonly PreviewRow[];
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const s = SIZES[size];
  return (
    <div aria-hidden className={cn("flex flex-col", s.gap, className)}>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className={cn("flex items-stretch", s.gap)}>
          <div
            className={cn("flex shrink-0 items-center justify-center", s.label)}
            style={{ background: row.color }}
          >
            <Text variant="tierLabelSm" tone="onTier">
              {row.label}
            </Text>
          </div>
          <div className={s.track}>
            {row.swatches.map((color, i) => (
              <div
                key={i}
                className={cn("shrink-0 rounded-[3px]", s.cell)}
                style={{ background: coverGradient(color) }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
