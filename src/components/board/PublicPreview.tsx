"use client";

import type { RefObject } from "react";
import { GlobeSimple, PencilSimple, Ranking } from "@phosphor-icons/react";

import { ReadOnlyBoard } from "@/components/board/ReadOnlyBoard";
import { Button } from "@/components/ui/Button";
import { Heading, Text } from "@/components/ui/Text";
import type { SaveFile } from "@/lib/types";

/**
 * What the board looks like once shared, before it is shared. The URL pill is
 * inert on purpose — this board has no slug until Publish mints one, and a
 * live-looking link that 404s is worse than no link.
 */
export function PublicPreview({
  save,
  rankedCount,
  boardRef,
  onBackToEditor,
}: {
  save: SaveFile;
  rankedCount: number;
  boardRef: RefObject<HTMLDivElement | null>;
  onBackToEditor: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-[52px] flex-none items-center gap-[12px] border-b border-divider px-[18px]">
        <div className="flex items-center gap-[8px] rounded-[9px] border border-divider bg-surface px-[12px] py-[7px]">
          <GlobeSimple size={15} className="text-neutral-500" />
          <Text variant="uiSm" tone="faint" className="font-normal">
            unicord.app/t/…
          </Text>
        </div>
        <Text variant="label" tone="muted">
          Preview only — share links arrive in Phase 2
        </Text>

        <div className="flex-1" />

        <Button
          variant="primary"
          icon={<PencilSimple size={15} />}
          onClick={onBackToEditor}
        >
          Back to editor
        </Button>
      </header>

      <div className="scrollbar flex-1 overflow-y-auto px-[18px] pt-[36px] pb-[60px]">
        <div className="mx-auto max-w-[940px]">
          <Heading>{save.title}</Heading>
          <Text as="p" variant="uiSm" tone="muted" className="mt-[4px] mb-[26px] font-normal">
            {rankedCount} titles ranked across {save.tiers.length} tiers
          </Text>

          <ReadOnlyBoard save={save} ref={boardRef} />

          <div className="mt-[30px] flex items-center justify-center gap-[7px]">
            <Ranking weight="fill" size={15} className="text-accent-500" />
            <Text variant="label" tone="faint">
              Made with Unicord
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}
