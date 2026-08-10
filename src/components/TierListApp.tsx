"use client";

import { useCallback, useRef, useState } from "react";

import { AnimeDetailModal } from "@/components/anime/AnimeDetailModal";
import { AppHeader, type BoardView } from "@/components/board/AppHeader";
import { BoardEditor } from "@/components/board/BoardEditor";
import { PublicPreview } from "@/components/board/PublicPreview";
import {
  PublishDialog,
  PublishedBoardLoader,
  type PublishedBoard,
} from "@/components/board/PublishDialog";
import { convex } from "@/components/ConvexClientProvider";
import { Toast } from "@/components/ui/Toast";
import { downloadSaveFile, readSaveFile, slugify } from "@/lib/storage";
import { useTierList } from "@/lib/useTierList";
import { useToast } from "@/lib/useToast";
import type { Media, SaveFile } from "@/lib/types";

/**
 * `?board=<slug>` opens an already-published board. Read straight off
 * `window` rather than through `useSearchParams`: this component is mounted
 * with `ssr: false`, so there is no server render to Suspend, and the hook
 * would push the whole route to dynamic rendering for one string.
 */
const slugFromUrl = (): string | null =>
  typeof window === "undefined"
    ? null
    : new URLSearchParams(window.location.search).get("board");

export function TierListApp() {
  const store = useTierList();
  const { toast, show, showError } = useToast();

  const [view, setView] = useState<BoardView>("editor");
  const [detailMedia, setDetailMedia] = useState<Media | null>(null);

  const [requestedSlug] = useState(slugFromUrl);
  const [board, setBoard] = useState<PublishedBoard | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);

  const boardRef = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const onError = useCallback((message: string) => show(message, "error"), [show]);

  const { save, replace } = store;

  const onBoardLoaded = useCallback(
    (data: SaveFile, loaded: PublishedBoard | null) => {
      // Goes through `replace`, so it lands on the undo stack — the same
      // escape hatch "Load save file" already gives you.
      replace(data);
      setBoard(loaded);
      show(
        loaded
          ? `Editing “${data.title}” — Share updates it`
          : `Opened a copy of “${data.title}” — Share publishes it as yours`,
      );
    },
    [replace, show],
  );

  function onShare() {
    if (!convex) {
      show("This deployment has no backend configured, so publishing is off", "error");
      return;
    }
    setPublishOpen(true);
  }

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
    // `overflow-hidden` is the editor's, not the document's: the board scrolls
    // in its own container inside BoardEditor and the page must not. It sits
    // here rather than on <body> so the landing page can scroll — see layout.tsx.
    <div className="flex h-full flex-col overflow-hidden bg-canvas text-ink">
      {view === "editor" ? (
        <>
          <AppHeader
            title={save.title}
            onTitleChange={store.setTitle}
            view={view}
            onViewChange={setView}
            onExportPng={exportPng}
            onShare={onShare}
            shareLabel={board ? "Update" : "Share"}
            publishedSlug={board?.slug ?? null}
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

      {convex && requestedSlug ? (
        <PublishedBoardLoader
          slug={requestedSlug}
          onLoad={onBoardLoaded}
          onError={onError}
        />
      ) : null}

      {convex ? (
        <PublishDialog
          open={publishOpen}
          onClose={() => setPublishOpen(false)}
          save={save}
          board={board}
          onPublished={(published) => {
            setBoard(published);
            show(board ? "Board updated" : "Board published");
          }}
        />
      ) : null}

      {toast ? <Toast message={toast.message} tone={toast.tone} /> : null}
    </div>
  );
}
