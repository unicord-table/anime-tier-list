"use client";

import { CloudCheck, Image as ImageIcon, Ranking, ShareNetwork } from "@phosphor-icons/react";

import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { Text } from "@/components/ui/Text";
import { TextInput } from "@/components/ui/TextInput";

export type BoardView = "editor" | "public";

export function AppHeader({
  title,
  onTitleChange,
  view,
  onViewChange,
  onExportPng,
  onShare,
}: {
  title: string;
  onTitleChange: (title: string) => void;
  view: BoardView;
  onViewChange: (view: BoardView) => void;
  onExportPng: () => void;
  onShare: () => void;
}) {
  return (
    <header className="flex h-[58px] flex-none items-center gap-[16px] border-b border-divider px-[16px]">
      <div className="flex items-center gap-[9px]">
        <div className="flex h-[30px] w-[30px] items-center justify-center rounded-md bg-[linear-gradient(150deg,var(--color-accent-500),var(--color-accent-800))] shadow-[0_0_0_1px_var(--color-accent-700)]">
          <Ranking weight="fill" size={18} className="text-accent-100" />
        </div>
        <Text variant="ui" className="font-semibold tracking-[-0.01em]">
          Tierist
        </Text>
      </div>

      <div className="h-[26px] w-px bg-divider" />

      <TextInput
        variant="inline"
        value={title}
        aria-label="Tier list title"
        onChange={(e) => onTitleChange(e.target.value)}
      />

      <Text variant="label" tone="muted" className="flex items-center gap-[5px]">
        <CloudCheck size={15} className="text-accent-400" />
        Saved to this device
      </Text>

      <div className="flex-1" />

      <Segmented
        aria-label="Board view"
        value={view}
        onChange={onViewChange}
        options={[
          { value: "editor", label: "Edit" },
          { value: "public", label: "Preview" },
        ]}
      />

      <Button
        variant="secondary"
        icon={<ImageIcon size={16} />}
        onClick={onExportPng}
      >
        PNG
      </Button>
      <Button
        variant="primary"
        icon={<ShareNetwork size={16} />}
        onClick={onShare}
      >
        Share
      </Button>
    </header>
  );
}
