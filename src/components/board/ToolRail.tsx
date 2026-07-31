"use client";

import {
  ArrowClockwise,
  ArrowCounterClockwise,
  FloppyDisk,
  FolderOpen,
  Image as ImageIcon,
  Plus,
} from "@phosphor-icons/react";

import { IconButton } from "@/components/ui/IconButton";

/**
 * The 54px rail down the left of the board.
 *
 * The design's last slot is a Settings gear that does nothing; it is a
 * "Load save file" picker here instead, because loading a .json is a real
 * feature with nowhere else to live.
 */
export function ToolRail({
  onAddTier,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onExportPng,
  onSaveJson,
  onLoadJson,
}: {
  onAddTier: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onExportPng: () => void;
  onSaveJson: () => void;
  onLoadJson: () => void;
}) {
  return (
    <nav
      aria-label="Board tools"
      className="flex w-[54px] flex-none flex-col items-center gap-[6px] border-r border-divider py-[12px]"
    >
      <IconButton title="Add tier" icon={<Plus weight="bold" />} onClick={onAddTier} />
      <div className="my-[3px] h-px w-[22px] bg-divider" />
      <IconButton
        title="Undo"
        icon={<ArrowCounterClockwise />}
        onClick={onUndo}
        disabled={!canUndo}
      />
      <IconButton
        title="Redo"
        icon={<ArrowClockwise />}
        onClick={onRedo}
        disabled={!canRedo}
      />
      <div className="flex-1" />
      <IconButton title="Export PNG" icon={<ImageIcon />} onClick={onExportPng} />
      <IconButton title="Save .json" icon={<FloppyDisk />} onClick={onSaveJson} />
      <IconButton title="Load save file" icon={<FolderOpen />} onClick={onLoadJson} />
    </nav>
  );
}
