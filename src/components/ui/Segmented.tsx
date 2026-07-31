import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The two-up pill switch used for Edit/Preview and Search/Import.
 * Rendered as a radiogroup so arrow keys and screen readers work.
 */

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  icon?: ReactNode;
};

type SegmentedProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Stretch each option to equal width — the catalog tabs do this. */
  fill?: boolean;
  "aria-label": string;
};

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  fill = false,
  "aria-label": ariaLabel,
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "flex items-center rounded-[9px] border border-divider bg-canvas p-[3px]",
        fill && "w-full",
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex cursor-pointer items-center justify-center gap-[6px]",
              "rounded-[6px] border-none py-[6px] transition-colors",
              "font-heading text-[13px] leading-[1.2] font-medium",
              fill ? "flex-1 px-0" : "px-[13px]",
              active
                ? "bg-[color-mix(in_srgb,var(--color-accent)_16%,transparent)] text-accent-200"
                : "bg-transparent text-neutral-400 hover:text-neutral-300",
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
