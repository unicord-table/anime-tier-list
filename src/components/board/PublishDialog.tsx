"use client";

import { useEffect, useRef, useState } from "react";
import { GlobeSimple } from "@phosphor-icons/react";
import { useMutation, useQuery } from "convex/react";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { CopyLinkButton } from "@/components/board/BoardActions";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Segmented } from "@/components/ui/Segmented";
import { Text } from "@/components/ui/Text";
import { TextInput } from "@/components/ui/TextInput";
import {
  LIMITS,
  PublishError,
  VISIBILITIES,
  boardUrl,
  prepareBoard,
  type Visibility,
} from "@/lib/publish";
import { errorMessage } from "@/lib/useToast";
import type { SaveFile } from "@/lib/types";

/**
 * Publish, or update what is already published.
 *
 * The board is validated locally before the round trip using the same
 * `prepareBoard` the mutation runs, so "this board has 1,240 titles" arrives
 * instantly instead of after an upload that was always going to be rejected.
 * The server still validates — this is a courtesy, not the gate.
 */

export type PublishedBoard = {
  id: Id<"tierlists">;
  slug: string;
  title: string;
  description: string;
  visibility: Visibility;
};

/**
 * Pulls `?board=<slug>` into the editor, once. Renders nothing.
 *
 * `board` is only handed back when the viewer owns it — otherwise the board is
 * loaded as an unowned copy, so Share publishes a new one rather than failing
 * against someone else's document.
 */
export function PublishedBoardLoader({
  slug,
  onLoad,
  onError,
}: {
  slug: string;
  onLoad: (data: SaveFile, board: PublishedBoard | null) => void;
  onError: (message: string) => void;
}) {
  const result = useQuery(api.tierlists.bySlug, { slug });
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current || result === undefined) return;
    handled.current = true;

    if (result === null) {
      onError("That tier list isn't available — it may have been deleted.");
      return;
    }
    onLoad(
      result.data,
      result.isOwner
        ? {
            id: result.id,
            slug: result.slug,
            title: result.title,
            description: result.description,
            visibility: result.visibility,
          }
        : null,
    );
  }, [result, onLoad, onError]);

  return null;
}

export function PublishDialog({
  open,
  onClose,
  save,
  board,
  onPublished,
}: {
  open: boolean;
  onClose: () => void;
  save: SaveFile;
  /** Non-null when this editor session is editing an already-published board. */
  board: PublishedBoard | null;
  onPublished: (board: PublishedBoard) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} label="Publish tier list" className="max-w-[520px]">
      {/* Reopening — or opening on a different board — must not show the last
          one's fields. A key remount resets the form's state, which is what
          React wants here instead of an effect full of setters. */}
      <PublishForm
        key={`${open}:${board?.id ?? "new"}`}
        onClose={onClose}
        save={save}
        board={board}
        onPublished={onPublished}
      />
    </Modal>
  );
}

function PublishForm({
  onClose,
  save,
  board,
  onPublished,
}: {
  onClose: () => void;
  save: SaveFile;
  board: PublishedBoard | null;
  onPublished: (board: PublishedBoard) => void;
}) {
  const viewer = useQuery(api.users.viewer);
  const publish = useMutation(api.tierlists.publish);
  const update = useMutation(api.tierlists.update);

  const [title, setTitle] = useState(board?.title ?? save.title);
  const [description, setDescription] = useState(board?.description ?? "");
  const [visibility, setVisibility] = useState<Visibility>(
    board?.visibility ?? "unlisted",
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [doneSlug, setDoneSlug] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      // Same caps the mutation enforces, run here first for a fast answer.
      const { data } = prepareBoard(save);

      const saved = board
        ? { ...(await update({ id: board.id, title, description, visibility, data })), id: board.id }
        : await publish({ title, description, visibility, data });

      setDoneSlug(saved.slug);
      onPublished({ id: saved.id, slug: saved.slug, title, description, visibility });
    } catch (err) {
      setError(err instanceof PublishError ? err.message : errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-[14px] px-[26px] pt-[26px] pb-[22px]">
        <div>
          <Text as="h2" variant="dialogTitle">
            {doneSlug ? "Published" : board ? "Update your board" : "Publish this board"}
          </Text>
          <Text as="p" variant="label" tone="muted" className="mt-[5px] block">
            {doneSlug
              ? "The link below is permanent until you delete the board."
              : "A published board is a snapshot. Editing here doesn't change it until you update."}
          </Text>
        </div>

        {doneSlug ? (
          <>
            <div className="flex items-center gap-[10px] rounded-[9px] border border-divider bg-canvas px-[12px] py-[10px]">
              <GlobeSimple size={16} className="shrink-0 text-accent-400" />
              <Text variant="uiSm" tone="subtle" className="min-w-0 truncate font-normal">
                {boardUrl(doneSlug)}
              </Text>
            </div>
            <div className="flex justify-end gap-[9px]">
              <CopyLinkButton slug={doneSlug} variant="secondary" />
              <Button variant="primary" onClick={onClose}>
                Done
              </Button>
            </div>
          </>
        ) : viewer === null ? (
          <Text as="p" variant="bodySm" tone="dim">
            Publishing needs an account, so the board has an owner who can edit
            and delete it. Sign in from the header, then try again.
          </Text>
        ) : (
          <>
            <label className="flex flex-col gap-[5px]">
              <Text variant="label" tone="muted">
                Title
              </Text>
              <TextInput
                value={title}
                maxLength={LIMITS.title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Best anime of the decade"
              />
            </label>

            <label className="flex flex-col gap-[5px]">
              <Text variant="label" tone="muted">
                Description
              </Text>
              <textarea
                value={description}
                maxLength={LIMITS.description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="What's the ranking, and what's the hill you'll die on?"
                className="w-full resize-y rounded-[9px] border border-divider bg-canvas px-[11px] py-[10px] font-body text-[14px] text-ink caret-accent placeholder:text-neutral-500 focus-visible:border-accent"
              />
            </label>

            <div className="flex flex-col gap-[7px]">
              <Text variant="label" tone="muted">
                Who can see it
              </Text>
              <Segmented
                aria-label="Visibility"
                fill
                value={visibility}
                onChange={setVisibility}
                options={VISIBILITIES.map((v) => ({ value: v.value, label: v.label }))}
              />
              <Text variant="caption" tone="faint">
                {VISIBILITIES.find((v) => v.value === visibility)?.hint}
              </Text>
            </div>

            {error ? (
              <Text as="p" variant="label" tone="accent" role="alert">
                {error}
              </Text>
            ) : null}

            <div className="flex justify-end gap-[9px]">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={busy || viewer === undefined || !title.trim()}
                onClick={() => void submit()}
              >
                {busy ? "Saving…" : board ? "Update" : "Publish"}
              </Button>
            </div>
          </>
        )}
    </div>
  );
}
