"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { nanoid } from "nanoid";

import * as board from "./board";
import { loadSave, persistSave } from "./storage";
import type { Media, MediaKey, Region, SaveFile } from "./types";

const HISTORY_LIMIT = 50;
const AUTOSAVE_MS = 400;

/**
 * Owns the board. Every mutation goes through `commit`, which snapshots the
 * previous SaveFile for undo — cheap, because board.ts only ever returns new
 * objects.
 */
export function useTierList() {
  // Safe to read localStorage in the initialiser: TierListApp is mounted with
  // ssr:false, so this hook never runs on the server and there is no markup to
  // mismatch. See TierListShell.
  const [save, setSave] = useState<SaveFile>(
    () => loadSave() ?? board.createEmptySave(),
  );
  const [past, setPast] = useState<SaveFile[]>([]);
  const [future, setFuture] = useState<SaveFile[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => persistSave(save), AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [save]);

  const commit = useCallback(
    (fn: (current: SaveFile) => SaveFile, { history = true } = {}) => {
      const next = fn(save);
      if (next === save) return;
      if (history) {
        setPast((p) => [...p.slice(-(HISTORY_LIMIT - 1)), save]);
        setFuture([]);
      }
      setSave(next);
    },
    [save],
  );

  const undo = useCallback(() => {
    if (past.length === 0) return;
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [save, ...f]);
    setSave(past[past.length - 1]);
  }, [past, save]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    setFuture((f) => f.slice(1));
    setPast((p) => [...p, save]);
    setSave(future[0]);
  }, [future, save]);

  const actions = useMemo(
    () => ({
      // ponytail: text edits skip history so a keystroke doesn't fill the undo
      // stack. Coalescing per-field would be the upgrade if anyone asks for it.
      setTitle: (title: string) =>
        commit((s) => board.setTitle(s, title), { history: false }),
      renameTier: (id: string, label: string) =>
        commit((s) => board.renameTier(s, id, label), { history: false }),

      recolorTier: (id: string, color: string) =>
        commit((s) => board.recolorTier(s, id, color)),
      addTier: () => commit((s) => board.addTier(s, nanoid(6))),
      removeTier: (id: string) => commit((s) => board.removeTier(s, id)),
      reorderTiers: (id: string, beforeId: string) =>
        commit((s) => board.reorderTiers(s, id, beforeId)),

      moveItem: (key: MediaKey, region: Region, index: number | null) =>
        commit((s) => board.moveItem(s, key, region, index)),
      addMedia: (media: Media, region: Region, index: number | null) =>
        commit((s) => board.addMedia(s, media, region, index)),
      addManyToPool: (list: Media[]) =>
        commit((s) => board.addManyToPool(s, list)),
      removeItem: (key: MediaKey) => commit((s) => board.removeItem(s, key)),

      replace: (next: SaveFile) => commit(() => next),
      reset: () => commit(() => board.createEmptySave()),
    }),
    [commit],
  );

  const placed = useMemo(() => board.placedKeys(save), [save]);

  return {
    save,
    placed,
    rankedCount: board.rankedCount(save),
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    undo,
    redo,
    ...actions,
  };
}

export type TierListStore = ReturnType<typeof useTierList>;
