import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Four input treatments the design uses. `field` is the boxed one, `search` is
 * the same box with room for a leading icon, `inline` is the board title that
 * only reveals a border on hover, `tier` is the big letter typed directly onto
 * a tier swatch.
 */

const VARIANTS = {
  field:
    "w-full rounded-[9px] border border-divider bg-canvas px-[11px] py-[10px] font-body text-[14px] text-ink placeholder:text-neutral-500 focus-visible:border-accent",
  /**
   * The left padding is the variant's own, not a call-site override: two
   * competing padding utilities are resolved by Tailwind's ordering rather
   * than by `cn`, which is the trap documented in frontend/design-system.md.
   */
  search:
    "w-full rounded-[9px] border border-divider bg-surface py-[9px] pr-[11px] pl-[32px] font-body text-[13px] text-ink placeholder:text-neutral-500 hover:border-neutral-700 focus-visible:border-accent focus-visible:bg-[color-mix(in_srgb,var(--color-accent)_6%,var(--color-surface))]",
  inline:
    "rounded-[6px] border border-transparent bg-transparent px-[8px] py-[5px] font-heading text-[17px] font-semibold tracking-[-0.01em] text-ink hover:bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)] focus:border-accent focus:bg-[color-mix(in_srgb,var(--color-ink)_6%,transparent)] focus:outline-none",
  tier: "w-full border-none bg-transparent p-0 text-center font-heading text-[21px] font-bold tracking-[-0.01em] text-canvas focus:outline-none",
} as const;

type TextInputProps = {
  variant?: keyof typeof VARIANTS;
} & InputHTMLAttributes<HTMLInputElement>;

export function TextInput({
  variant = "field",
  className,
  spellCheck = false,
  ...rest
}: TextInputProps) {
  return (
    <input
      spellCheck={spellCheck}
      className={cn("caret-accent", VARIANTS[variant], className)}
      {...rest}
    />
  );
}
