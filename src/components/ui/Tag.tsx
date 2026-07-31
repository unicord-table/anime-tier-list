import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Nocturne `.tag`. */

const TONES = {
  accent: "bg-accent-800 text-accent-100",
  neutral: "bg-neutral-800 text-neutral-100",
  outline: "border border-accent text-accent",
} as const;

type TagProps = {
  tone?: keyof typeof TONES;
  children: ReactNode;
  className?: string;
};

export function Tag({ tone = "neutral", children, className }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[6px] px-[10px] py-[3px]",
        "font-body text-[11px] tracking-[0.02em]",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
