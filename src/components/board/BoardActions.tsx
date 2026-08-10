"use client";

import { useState } from "react";
import { Check, Copy, PencilSimple } from "@phosphor-icons/react";

import { Button } from "@/components/ui/Button";
import { boardUrl } from "@/lib/publish";
import { persistSave } from "@/lib/storage";
import { TIERLIST_ROUTE } from "@/lib/feed";
import type { SaveFile } from "@/lib/types";

/**
 * The two things a visitor can do with someone else's published board.
 * Client-only: one touches the clipboard, the other touches localStorage.
 */

export function CopyLinkButton({
  slug,
  variant = "secondary",
  label = "Copy link",
}: {
  slug: string;
  variant?: "primary" | "secondary" | "ghost";
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(boardUrl(slug));
      setFailed(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard access is refused outside a secure context and in some
      // embedded browsers. Say so rather than silently doing nothing.
      setFailed(true);
    }
  }

  return (
    <Button
      variant={variant}
      icon={copied ? <Check size={15} weight="bold" /> : <Copy size={15} />}
      onClick={() => void copy()}
    >
      {failed ? "Copy failed" : copied ? "Copied" : label}
    </Button>
  );
}

/**
 * "Open as my own copy". A read-only page is a dead end; this is what turns one
 * shared link into two boards. It is `store.replace` plus a local save, which
 * is why it costs almost nothing.
 */
export function RemixButton({ data }: { data: SaveFile }) {
  return (
    <Button
      variant="primary"
      icon={<PencilSimple size={15} />}
      onClick={() => {
        persistSave({ ...data, updatedAt: new Date().toISOString() });
        // A full load, not a client transition: the editor reads localStorage
        // in a useState initialiser, so it has to mount fresh to see this.
        window.location.assign(TIERLIST_ROUTE);
      }}
    >
      Remix into my editor
    </Button>
  );
}
