import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The tool-rail button from the design (`.atl-icon`): square, quiet until
 * hovered. `title` is required — these have no visible label, so without it
 * they are unusable with a screen reader.
 */

const SIZES = {
  md: "h-[38px] w-[38px] rounded-md text-[19px]",
  sm: "h-[22px] w-[22px] rounded-[6px] text-[13px]",
} as const;

const TONES = {
  rail: "text-neutral-400 hover:bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)] hover:text-accent-300",
  /** Sits on a filled tier swatch. */
  onTier: "bg-[rgba(20,22,34,.22)] text-canvas hover:bg-[rgba(20,22,34,.35)]",
} as const;

type IconButtonProps = {
  title: string;
  icon: ReactNode;
  size?: keyof typeof SIZES;
  tone?: keyof typeof TONES;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "title">;

export function IconButton({
  title,
  icon,
  size = "md",
  tone = "rail",
  className,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      title={title}
      aria-label={title}
      className={cn(
        "flex flex-none cursor-pointer items-center justify-center",
        "border border-transparent bg-transparent transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-40",
        SIZES[size],
        TONES[tone],
        className,
      )}
      {...rest}
    >
      {icon}
    </button>
  );
}
