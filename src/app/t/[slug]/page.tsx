import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Ranking } from "@phosphor-icons/react/ssr";

import { api } from "@convex/_generated/api";
import { CopyLinkButton, RemixButton } from "@/components/board/BoardActions";
import { ReadOnlyBoard } from "@/components/board/ReadOnlyBoard";
import { SiteFooter, SiteHeader } from "@/components/feed/SiteChrome";
import { formatDate } from "@/components/feed/BoardCard";
import { Tag } from "@/components/ui/Tag";
import { Heading, Text } from "@/components/ui/Text";
import { serverQuery } from "@/lib/convex-server";

/**
 * A published board. One database read renders the whole page — every title and
 * cover URL is denormalized into the stored save file, so there are no catalog
 * API calls here.
 *
 * Rendered anonymously: `serverQuery` sends no auth token, so a `private` board
 * resolves to null here and 404s. Its owner reaches it from `/tierlists`, where
 * the client connection carries their session.
 */

type Params = { params: Promise<{ slug: string }> };

const load = async (slug: string) =>
  serverQuery(api.tierlists.bySlug, { slug });

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const board = await load((await params).slug);
  if (!board) return { title: "Tier list not found — Tierist" };

  return {
    title: `${board.title} — Tierist`,
    description:
      board.description ||
      `${board.itemCount} titles ranked across ${board.tierCount} tiers by ${board.author.name}.`,
    // Off until discovery is something the product actually wants — see
    // .docs/architecture/sharing.md. A share link still works; it just isn't
    // crawled.
    robots: { index: false, follow: true },
  };
}

export default async function PublishedBoardPage({ params }: Params) {
  const board = await load((await params).slug);
  if (!board) notFound();

  return (
    <div className="min-h-full bg-canvas text-ink">
      <SiteHeader />

      <main className="mx-auto max-w-[940px] px-[26px] pt-[40px] pb-[60px]">
        <div className="mb-[6px] flex flex-wrap items-center gap-[10px]">
          <Text variant="label" tone="subtle">
            {board.author.name}
          </Text>
          <Text variant="label" tone="ghost">
            ·
          </Text>
          <Text
            as="time"
            variant="label"
            tone="faint"
            dateTime={new Date(board.createdAt).toISOString()}
          >
            {formatDate(board.createdAt)}
          </Text>
          {board.visibility !== "public" ? (
            <Tag tone="outline">{board.visibility}</Tag>
          ) : null}
        </div>

        <Heading>{board.title}</Heading>

        {board.description ? (
          <Text as="p" variant="body" tone="subtle" className="mt-[10px] block max-w-[68ch] text-pretty">
            {board.description}
          </Text>
        ) : null}

        <div className="mt-[18px] mb-[26px] flex flex-wrap items-center gap-[10px]">
          <Text variant="label" tone="faint">
            {board.itemCount} titles across {board.tierCount} tiers
          </Text>
          <div className="flex-1" />
          <CopyLinkButton slug={board.slug} />
          <RemixButton data={board.data} />
        </div>

        <ReadOnlyBoard save={board.data} />

        <div className="mt-[30px] flex items-center justify-center gap-[7px]">
          <Ranking weight="fill" size={15} className="text-accent-500" />
          <Link href="/" className="text-accent-300 hover:text-accent-200">
            <Text variant="label" tone="inherit">
              Made with Tierist
            </Text>
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
