import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Nocturne `.btn` — primary / secondary / ghost. */

const VARIANTS = {
  primary:
    "text-accent border-accent hover:bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)] active:bg-[color-mix(in_srgb,var(--color-accent)_22%,transparent)]",
  secondary:
    "text-ink border-divider hover:bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)] active:bg-[color-mix(in_srgb,var(--color-ink)_14%,transparent)]",
  ghost:
    "text-accent border-transparent hover:bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] active:bg-[color-mix(in_srgb,var(--color-accent)_18%,transparent)]",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

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
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-[6px]",
        "rounded-md border border-transparent bg-transparent",
        "px-[10px] py-[5.6px]",
        "font-heading text-[14px] leading-[1.2] font-medium",
        "transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
