"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowClockwise, PencilSimple, Trash } from "@phosphor-icons/react";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { CopyLinkButton } from "@/components/board/BoardActions";
import { BoardCard } from "@/components/feed/BoardCard";
import { convex } from "@/components/ConvexClientProvider";
import { Button, buttonClass } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { Toast } from "@/components/ui/Toast";
import { useToast } from "@/lib/useToast";
import { FEED_PAGE, TIERLIST_ROUTE } from "@/lib/feed";

/**
 * The signed-in user's own boards. Client-rendered because it is the only page
 * whose content depends on who is asking, and the session lives in the browser
 * (`@convex-dev/auth/react`, decisions.md D11).
 */

export function MyBoards() {
  // Outside a ConvexAuthProvider the hooks below throw, so the guard sits in a
  // component that calls none of them — same shape as AccountMenu.
  if (!convex) {
    return (
      <Notice>
        No Convex deployment is configured, so there is nothing to list. The
        editor still works and still saves to this device.
      </Notice>
    );
  }
  return <Boards />;
}

function Boards() {
  const viewer = useQuery(api.users.viewer);
  const { results, status, loadMore } = usePaginatedQuery(
    api.tierlists.mine,
    {},
    { initialNumItems: FEED_PAGE },
  );
  const remove = useMutation(api.tierlists.remove);
  const { toast, show, showError } = useToast();
  const [busy, setBusy] = useState<Id<"tierlists"> | null>(null);

  async function onDelete(id: Id<"tierlists">, title: string) {
    // Native confirm rather than a bespoke dialog: it is one destructive
    // action, and the platform already blocks, focuses and traps correctly.
    if (!window.confirm(`Delete “${title}”? The share link stops working.`)) return;
    setBusy(id);
    try {
      await remove({ id });
      show("Tier list deleted");
    } catch (err) {
      showError(err);
    } finally {
      setBusy(null);
    }
  }

  if (viewer === undefined || status === "LoadingFirstPage") {
    return <Notice>Loading your tier lists…</Notice>;
  }

  if (viewer === null) {
    return (
      <Notice>
        Sign in to see the tier lists you have published. Use the button in the
        header — boards on this device stay saved either way.
      </Notice>
    );
  }

  if (results.length === 0) {
    return (
      <div className="rounded-[12px] border border-dashed border-neutral-800 p-[44px] text-center">
        <Text as="p" variant="bodySm" tone="dim" className="mb-[16px] block">
          You haven&rsquo;t published a tier list yet. Build one, then hit Share
          in the editor.
        </Text>
        <Link href={TIERLIST_ROUTE} className={buttonClass("primary")}>
          Open the editor
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-[14px]">
        {results.map((board) => (
          <BoardCard
            key={board.id}
            board={board}
            actions={
              <div className="flex flex-wrap items-center gap-[8px]">
                <CopyLinkButton slug={board.slug} variant="ghost" />
                <Link
                  href={`${TIERLIST_ROUTE}?board=${board.slug}`}
                  className={buttonClass("secondary", "gap-[6px]")}
                >
                  <PencilSimple size={15} />
                  Edit
                </Link>
                <Button
                  variant="ghost"
                  icon={<Trash size={15} />}
                  disabled={busy === board.id}
                  onClick={() => void onDelete(board.id, board.title)}
                >
                  Delete
                </Button>
              </div>
            }
          />
        ))}
      </div>

      {status === "CanLoadMore" || status === "LoadingMore" ? (
        <Button
          variant="secondary"
          className="mt-[18px] w-full gap-[8px] py-[12px]"
          disabled={status === "LoadingMore"}
          icon={<ArrowClockwise size={15} />}
          onClick={() => loadMore(FEED_PAGE)}
        >
          {status === "LoadingMore" ? "Loading…" : "Load more"}
        </Button>
      ) : null}

      {toast ? <Toast message={toast.message} tone={toast.tone} /> : null}
    </>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] border border-dashed border-neutral-800 p-[44px] text-center">
      <Text as="p" variant="bodySm" tone="dim" className="mx-auto block max-w-[46ch]">
        {children}
      </Text>
    </div>
  );
}
