"use client";

import { useEffect, useState } from "react";
import { DownloadSimple, MagnifyingGlass } from "@phosphor-icons/react";

import { DraggableCatalogCard } from "@/components/dnd/DragParts";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { SectionLabel, Text } from "@/components/ui/Text";
import { TextInput } from "@/components/ui/TextInput";
import { fetchTrending, fetchUserList, searchAnime } from "@/lib/anilist";
import { useDebounced } from "@/lib/useDebounced";
import type { Media, MediaKey } from "@/lib/types";

type CatalogTab = "search" | "import";

export function CatalogPanel({
  placed,
  onOpenCard,
  onImport,
  onError,
}: {
  placed: Set<MediaKey>;
  onOpenCard: (media: Media) => void;
  onImport: (list: Media[]) => void;
  onError: (message: string) => void;
}) {
  const [tab, setTab] = useState<CatalogTab>("search");
  const [query, setQuery] = useState("");
  const [importUser, setImportUser] = useState("");
  const [importing, setImporting] = useState(false);

  const term = useDebounced(query, 350).trim();

  // Results are stored alongside the term that produced them, so "still
  // loading" is derived rather than a second piece of state to keep in sync.
  const [data, setData] = useState<{ term: string; list: Media[] } | null>(null);
  const loading = data?.term !== term;
  const results = data?.list ?? [];

  // An empty box shows what's trending, so the panel is never a blank grid.
  useEffect(() => {
    const controller = new AbortController();

    (term ? searchAnime(term, controller.signal) : fetchTrending(controller.signal))
      .then((list) => setData({ term, list }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setData({ term, list: [] });
        onError(err instanceof Error ? err.message : "Search failed");
      });

    return () => controller.abort();
  }, [term, onError]);

  async function runImport() {
    const name = importUser.trim();
    if (!name || importing) return;
    setImporting(true);
    try {
      const list = await fetchUserList(name);
      if (list.length === 0) {
        onError(`No public anime list found for @${name}`);
      } else {
        onImport(list);
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <aside className="flex w-[336px] flex-none flex-col border-r border-divider bg-surface">
      <div className="px-[16px] pt-[16px]">
        <div className="mb-[11px] flex items-center justify-between">
          <Text as="h2" variant="eyebrow" tone="dim">
            Catalog
          </Text>
          <Text variant="caption" tone="muted">
            AniList · no login
          </Text>
        </div>

        <div className="mb-[13px]">
          <Segmented
            fill
            aria-label="Catalog source"
            value={tab}
            onChange={setTab}
            options={[
              { value: "search", label: "Search", icon: <MagnifyingGlass size={15} /> },
              { value: "import", label: "Import", icon: <DownloadSimple size={15} /> },
            ]}
          />
        </div>
      </div>

      {tab === "search" ? (
        <div className="px-[16px] pb-[4px]">
          <div className="relative">
            <MagnifyingGlass
              size={16}
              className="pointer-events-none absolute top-1/2 left-[11px] -translate-y-1/2 text-neutral-500"
            />
            <TextInput
              value={query}
              aria-label="Search anime titles"
              placeholder="Search anime titles…"
              className="pl-[34px]"
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      ) : (
        <div className="px-[16px] pb-[4px]">
          <Text as="label" variant="label" tone="muted" className="mb-[6px] block">
            AniList or MyAnimeList username
          </Text>
          <div className="flex gap-[8px]">
            <TextInput
              value={importUser}
              placeholder="e.g. shirokuma"
              aria-label="Username to import"
              className="min-w-0 flex-1"
              onChange={(e) => setImportUser(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runImport()}
            />
            <Button variant="primary" onClick={runImport} disabled={importing}>
              {importing ? "Importing…" : "Import"}
            </Button>
          </div>
          <Text as="p" variant="caption" tone="muted" className="mt-[8px]">
            Pulls a public list straight into the pool in one request — no account
            needed.
          </Text>
        </div>
      )}

      <div className="flex items-center justify-between px-[16px] pt-[14px] pb-[9px]">
        <SectionLabel>Results</SectionLabel>
        <Text variant="caption" tone="muted">
          {loading ? "Loading…" : `${results.length} titles · drag to a tier`}
        </Text>
      </div>

      <div className="scrollbar grid flex-1 grid-cols-3 content-start gap-[10px] overflow-y-auto px-[16px] pb-[16px]">
        {results.map((media) => (
          <DraggableCatalogCard
            key={media.key}
            media={media}
            onOpen={onOpenCard}
            onBoard={placed.has(media.key)}
          />
        ))}

        {!loading && results.length === 0 ? (
          <Text variant="label" tone="muted" className="col-span-3 py-[8px]">
            No titles matched that search.
          </Text>
        ) : null}
      </div>
    </aside>
  );
}
