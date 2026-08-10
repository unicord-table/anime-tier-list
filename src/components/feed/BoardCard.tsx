import type { ReactNode } from "react";
import Link from "next/link";
import { Stack, User } from "@phosphor-icons/react/ssr";

import { BoardThumb } from "@/components/feed/BoardThumb";
import { Tag } from "@/components/ui/Tag";
import { Text } from "@/components/ui/Text";
import { boardPath } from "@/lib/publish";
// Type-only, so nothing from convex/ is bundled into the client.
import type { BoardSummary } from "@convex/tierlists";

/**
 * One published board, on the feed and on the owner's listing page. `actions`
 * is where the listing page hangs copy-link / edit / delete; the feed passes
 * nothing.
 *
 * There are no like, comment or view counts. Those need tables and a
 * signed-in mutation that do not exist — a number with nothing behind it is
 * worse than no number.
 */
export function BoardCard({
  board,
  actions,
}: {
  board: BoardSummary;
  actions?: ReactNode;
}) {
  const href = boardPath(board.slug);
  return (
    <article className="grid grid-cols-1 gap-[16px] rounded-[12px] bg-surface p-[14px] shadow-sm transition-shadow hover:shadow-md sm:grid-cols-[186px_minmax(0,1fr)]">
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden
        className="self-start rounded-[9px] bg-canvas p-[9px]"
      >
        <BoardThumb rows={board.preview} size="sm" />
      </Link>

      <div className="flex min-w-0 flex-col">
        <div className="mb-[7px] flex flex-wrap items-center gap-[9px]">
          <Avatar board={board} />
          <Text variant="uiSm" tone="bright">
            {board.author.name}
          </Text>
          <Text variant="label" tone="ghost">
            ·
          </Text>
          <Text as="time" variant="label" tone="faint" dateTime={new Date(board.createdAt).toISOString()}>
            {formatDate(board.createdAt)}
          </Text>
          {board.visibility !== "public" ? (
            <Tag tone="outline">{board.visibility}</Tag>
          ) : null}
        </div>

        <Link href={href} className="text-ink">
          <Text as="h3" variant="title" className="mb-[5px] block">
            {board.title}
          </Text>
        </Link>

        {board.description ? (
          <Text as="p" variant="bodySm" tone="dim" clamp={3} className="mb-[11px] block text-pretty">
            {board.description}
          </Text>
        ) : null}

        <div className="flex-1" />

        <div className="flex flex-wrap items-center gap-x-[14px] gap-y-[8px]">
          <Text variant="label" tone="faint" className="flex items-center gap-[6px]">
            <Stack size={14} />
            {board.itemCount} {board.itemCount === 1 ? "title" : "titles"} in{" "}
            {board.tierCount} tiers
          </Text>
          <div className="flex-1" />
          {actions}
        </div>
      </div>
    </article>
  );
}

function Avatar({ board }: { board: BoardSummary }) {
  if (board.author.image) {
    return (
      // Plain <img>, no-referrer: same reasoning as AccountMenu's avatar —
      // Google's avatar CDN 403s on some Referer headers.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={board.author.image}
        alt=""
        referrerPolicy="no-referrer"
        className="h-[22px] w-[22px] shrink-0 rounded-full object-cover"
      />
    );
  }
  return <User size={22} className="shrink-0 text-neutral-500" />;
}

/**
 * Fixed locale and UTC: the server renders this string and the client must not
 * produce a different one, or React reports a hydration mismatch.
 */
export const formatDate = (ms: number): string =>
  new Date(ms).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
