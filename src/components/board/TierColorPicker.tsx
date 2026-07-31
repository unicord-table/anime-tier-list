"use client";

import { useEffect, useRef, useState } from "react";
import { Palette } from "@phosphor-icons/react";

import { IconButton } from "@/components/ui/IconButton";
import { TIER_PRESET_COLORS } from "@/lib/board";

/**
 * Palette button plus its swatch popover. The trigger lives inside the same
 * wrapper the outside-click handler watches, so clicking it toggles instead of
 * closing-then-reopening.
 */
export function TierColorPicker({
  tierLabel,
  onPick,
}: {
  tierLabel: string;
  onPick: (color: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapper} className="relative">
      <IconButton
        size="sm"
        tone="onTier"
        title={`Colour for tier ${tierLabel}`}
        aria-expanded={open}
        icon={<Palette />}
        onClick={() => setOpen((v) => !v)}
      />

      {open ? (
        <div
          role="group"
          aria-label="Tier colours"
          className="absolute top-[calc(100%+6px)] left-0 z-20 grid w-[132px] grid-cols-4 gap-[7px] rounded-md bg-surface p-[9px] shadow-md"
        >
          {TIER_PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              title={color}
              aria-label={color}
              onClick={() => {
                onPick(color);
                setOpen(false);
              }}
              style={{ background: color }}
              className="h-[24px] w-[24px] cursor-pointer rounded-[6px] border border-[rgba(255,255,255,.14)]"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
