import type { ReactNode } from "react";
import { ArrowSquareOut } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

/** Button-shaped outbound link. Always noopener — these point off-site. */
export function ExternalLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-[6px] rounded-md border border-divider",
        "px-[10px] py-[5.6px] font-heading text-[14px] font-medium text-ink",
        "transition-colors hover:bg-[color-mix(in_srgb,var(--color-ink)_7%,transparent)]",
        className,
      )}
    >
      {children}
      <ArrowSquareOut size={15} />
    </a>
  );
}
