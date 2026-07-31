"use client";

import { useCallback, useRef, useState } from "react";

import { AnimeDetailModal } from "@/components/anime/AnimeDetailModal";
import { AppHeader, type BoardView } from "@/components/board/AppHeader";
import { BoardEditor } from "@/components/board/BoardEditor";
import { PublicPreview } from "@/components/board/PublicPreview";
import { Toast } from "@/components/ui/Toast";
import { downloadSaveFile, readSaveFile, slugify } from "@/lib/storage";
import { useTierList } from "@/lib/useTierList";
import { useToast } from "@/lib/useToast";
import type { Media } from "@/lib/types";

export function TierListApp() {
  const store = useTierList();
  const { toast, show, showError } = useToast();

  const [view, setView] = useState<BoardView>("editor");
  const [detailMedia, setDetailMedia] = useState<Media | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const onError = useCallback((message: string) => show(message, "error"), [show]);

  const { save } = store;

  async function exportPng() {
    if (!boardRef.current) return;
    try {
      // Loaded on demand — nobody pays for the rasteriser until they click.
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(boardRef.current, {
        pixelRatio: 2,
        backgroundColor: "#161826",
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${slugify(save.title)}.png`;
      link.click();
      show("Board exported as PNG");
    } catch (err) {
      showError(err);
    }
  }

  function saveJson() {
    downloadSaveFile(save);
    show("Save file downloaded");
  }

  async function onFilePicked(file: File | undefined) {
    if (!file) return;
    try {
      store.replace(await readSaveFile(file));
      show("Save file loaded");
    } catch (err) {
      showError(err);
    }
  }

  return (
    <div className="flex h-full flex-col bg-canvas text-ink">
      {view === "editor" ? (
        <>
          <AppHeader
            title={save.title}
            onTitleChange={store.setTitle}
            view={view}
            onViewChange={setView}
            onExportPng={exportPng}
            onShare={() =>
              show("Publishing arrives in Phase 2 — export a PNG or .json for now")
            }
          />
          <BoardEditor
            store={store}
            boardRef={boardRef}
            onOpenCard={setDetailMedia}
            onError={onError}
            onImported={(count) => show(`Imported ${count} titles into the pool`)}
            onExportPng={exportPng}
            onSaveJson={saveJson}
            onLoadJson={() => fileInput.current?.click()}
          />
        </>
      ) : (
        <PublicPreview
          save={save}
          rankedCount={store.rankedCount}
          boardRef={boardRef}
          onBackToEditor={() => setView("editor")}
        />
      )}

      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          void onFilePicked(e.target.files?.[0]);
          // Reset so picking the same file twice still fires a change.
          e.target.value = "";
        }}
      />

      <AnimeDetailModal
        media={detailMedia}
        onClose={() => setDetailMedia(null)}
        onBoard={detailMedia ? store.placed.has(detailMedia.key) : false}
        onAdd={(media) => {
          store.addMedia(media, "pool", null);
          show(`${media.title} added to the pool`);
        }}
        onRemove={(media) => {
          store.removeItem(media.key);
          setDetailMedia(null);
          show(`${media.title} removed from the board`);
        }}
      />

      {toast ? <Toast message={toast.message} tone={toast.tone} /> : null}
    </div>
  );
}
