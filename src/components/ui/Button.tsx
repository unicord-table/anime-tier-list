import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Nocturne `.btn` — primary / secondary / ghost, plus `social`, the filled
 * OAuth button from the sign-in modal.
 *
 * Each variant carries its own background, border colour and padding rather
 * than overriding a shared default. `cn` is a plain joiner, so two competing
 * `bg-*` / `border-*` / `px-*` classes get resolved by Tailwind's own
 * ordering, not by which one is listed last — which is why the base used to
 * set `border-transparent` and every variant's border silently lost to it.
 */

const PAD = "px-[10px] py-[5.6px]";

const VARIANTS = {
  primary:
    PAD + " bg-transparent text-accent border-accent hover:bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)] active:bg-[color-mix(in_srgb,var(--color-accent)_22%,transparent)]",
  secondary:
    PAD + " bg-transparent text-ink border-divider hover:bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)] active:bg-[color-mix(in_srgb,var(--color-ink)_14%,transparent)]",
  ghost:
    PAD + " bg-transparent text-accent border-transparent hover:bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] active:bg-[color-mix(in_srgb,var(--color-accent)_18%,transparent)]",
  /** Taller than the rest — it is the primary affordance in the sign-in modal. */
  social:
    "px-[12px] py-[10px] bg-canvas text-ink border-divider hover:border-accent-700 hover:bg-[color-mix(in_srgb,var(--color-accent)_9%,var(--color-canvas))] active:bg-[color-mix(in_srgb,var(--color-accent)_16%,var(--color-canvas))]",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

const BASE =
  "inline-flex cursor-pointer items-center justify-center gap-[6px] rounded-md border " +
  "font-heading text-[14px] leading-[1.2] font-medium " +
  "transition-colors disabled:cursor-not-allowed disabled:opacity-45";

/**
 * The same skin as `<Button>`, for the handful of call sites that need an
 * anchor: a `<Link>` cannot be a `<button>`, and nesting one inside the other
 * is invalid. Keeps both on one source of truth rather than a copied class
 * string that drifts.
 */
export const buttonClass = (variant: ButtonVariant = "secondary", className?: string) =>
  cn(BASE, VARIANTS[variant], className);

type ButtonProps = {
  variant?: ButtonVariant;
  icon?: ReactNode;
  children?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = "secondary",
  icon,
  children,
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass(variant, className)}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
