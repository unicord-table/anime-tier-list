"use client";

import type { RefObject } from "react";
import { GlobeSimple, PencilSimple, Ranking } from "@phosphor-icons/react";

import { AnimeCard } from "@/components/anime/AnimeCard";
import { Button } from "@/components/ui/Button";
import { Heading, Text } from "@/components/ui/Text";
import type { SaveFile } from "@/lib/types";

/**
 * What the board looks like once shared. The URL pill is deliberately inert:
 * publishing is Phase 2, and showing a live-looking link (or a fabricated view
 * count, as the mock does) would imply a backend that does not exist yet.
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
            tierist.app/t/…
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

          <div ref={boardRef} className="bg-canvas">
            {save.tiers.map((tier) => (
              <div
                key={tier.id}
                className="mb-[11px] flex rounded-[10px] shadow-[0_0_0_1px_var(--color-neutral-800)]"
              >
                <div
                  style={{ background: tier.color }}
                  className="flex w-[88px] min-h-[104px] flex-none items-center justify-center rounded-l-[10px] p-[8px]"
                >
                  <Text variant="tierLabelLg" tone="onTier">
                    {tier.label}
                  </Text>
                </div>
                <div className="flex min-w-0 flex-1 flex-wrap content-start gap-[9px] rounded-r-[10px] bg-surface p-[9px]">
                  {tier.items
                    .filter((key) => save.media[key])
                    .map((key) => (
                      <AnimeCard
                        key={key}
                        media={save.media[key]}
                        size="public"
                        interactive={false}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-[30px] flex items-center justify-center gap-[7px]">
            <Ranking weight="fill" size={15} className="text-accent-500" />
            <Text variant="label" tone="faint">
              Made with Tierist
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}
