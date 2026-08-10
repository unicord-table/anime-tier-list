"use client";

import Link from "next/link";
import {
  CloudCheck,
  GlobeSimple,
  Image as ImageIcon,
  ShareNetwork,
} from "@phosphor-icons/react";

import { AccountMenu } from "@/components/auth/AccountMenu";
import { Brand } from "@/components/ui/Brand";
import { Button, buttonClass } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { Text } from "@/components/ui/Text";
import { TextInput } from "@/components/ui/TextInput";
import { boardPath } from "@/lib/publish";

export type BoardView = "editor" | "public";

export function AppHeader({
  title,
  onTitleChange,
  view,
  onViewChange,
  onExportPng,
  onShare,
  shareLabel = "Share",
  publishedSlug = null,
}: {
  title: string;
  onTitleChange: (title: string) => void;
  view: BoardView;
  onViewChange: (view: BoardView) => void;
  onExportPng: () => void;
  onShare: () => void;
  /** "Update" once this board has been published from this session. */
  shareLabel?: string;
  publishedSlug?: string | null;
}) {
  return (
    <header className="flex h-[58px] flex-none items-center gap-[16px] border-b border-divider px-[16px]">
      {/* The only way out of the editor and back to the feed. */}
      <Link href="/" aria-label="Tierist home">
        <Brand />
      </Link>

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

      <AccountMenu />

      {publishedSlug ? (
        <Link
          href={boardPath(publishedSlug)}
          target="_blank"
          className={buttonClass("ghost", "gap-[6px]")}
        >
          <GlobeSimple size={16} />
          View live
        </Link>
      ) : null}

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
        {shareLabel}
      </Button>
    </header>
  );
}
