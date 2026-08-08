"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "@phosphor-icons/react";
import { IconButton } from "./IconButton";
import { cn } from "@/lib/cn";

/**
 * Built on native <dialog>. showModal() gives focus trapping, Escape-to-close,
 * inert background content and top-layer stacking for free — all of which a
 * hand-rolled div would have to reimplement, badly.
 */

type ModalProps = {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  className?: string;
  /**
   * Extra classes for the close button. Only needed when it sits on something
   * other than the panel — the detail modal puts it over cover art.
   */
  closeClassName?: string;
};

export function Modal({
  open,
  onClose,
  label,
  children,
  className,
  closeClassName,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      // Fires for Escape too, so this is the single close path.
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // A click landing on the dialog element itself is a backdrop click; any
      // click inside the panel is caught by the child's own stopPropagation.
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        "m-auto max-h-none max-w-none overflow-visible bg-transparent p-0 text-ink",
        "backdrop:bg-[color-mix(in_srgb,var(--color-neutral-900)_70%,transparent)]",
        "backdrop:backdrop-blur-[2px]",
      )}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative flex max-h-[86vh] w-[min(760px,92vw)] flex-col overflow-hidden",
          "rounded-lg bg-surface shadow-lg",
          className,
        )}
      >
        <IconButton
          title="Close"
          icon={<X weight="bold" />}
          onClick={onClose}
          className={cn("absolute top-[14px] right-[14px] z-10", closeClassName)}
        />
        {children}
      </div>
    </dialog>
  );
}
