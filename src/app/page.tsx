import Link from "next/link";
import { Lightning, Ranking, SquaresFour } from "@phosphor-icons/react/ssr";

import { api } from "@convex/_generated/api";
import { BoardCard } from "@/components/feed/BoardCard";
import { BoardThumb } from "@/components/feed/BoardThumb";
import { FeedSidebar } from "@/components/feed/FeedSidebar";
import { SiteFooter, SiteHeader } from "@/components/feed/SiteChrome";
import { buttonClass } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { Text } from "@/components/ui/Text";
import { convexConfigured, serverQuery } from "@/lib/convex-server";
import { FEED_PAGE, TIERLIST_ROUTE } from "@/lib/feed";

/**
 * The landing page. A scrolling document, server-rendered: the search term
 * travels in the query string rather than in client state, so the feed is
 * crawlable, linkable, and costs no JavaScript. The editor lives at
 * `/tierlist`.
 *
 * Everything below the hero is real published data. There is no sample content
 * and no featured strip — featuring needs someone to do the featuring.
 */

/** Three facts about what the editor already does. No invented usage metrics. */
const STATS = [
  { value: "6", label: "tier rows by default, add as many as you like" },
  { value: "1,200+", label: "titles pulled in one AniList import" },
  { value: "2×", label: "pixel density on every PNG export" },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";

  const boards =
    (await serverQuery(api.tierlists.feed, { query, limit: FEED_PAGE })) ?? [];

  return (
    <div className="min-h-full bg-canvas text-ink">
      <SiteHeader query={query} />

      <section className="relative overflow-hidden border-b border-divider">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-[140px] -left-[60px] h-[340px] w-[520px] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-accent)_22%,transparent),transparent)] blur-[18px]"
        />
        <div className="relative mx-auto grid max-w-[1220px] grid-cols-1 items-center gap-[48px] px-[26px] pt-[52px] pb-[44px] lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <Tag tone="accent" className="mb-[16px]">
              Publish a board and share the link
            </Tag>
            <Text as="h1" variant="hero" className="mb-[14px] block max-w-[15ch]">
              Everyone&rsquo;s anime rankings, in one feed.
            </Text>
            <Text as="p" variant="body" tone="subtle" className="mb-[26px] block max-w-[52ch] text-pretty">
              Build a board in a minute, drag titles straight out of AniList, and
              publish it to a permanent link. No account needed to start one.
            </Text>

            <div className="flex flex-wrap items-center gap-[12px]">
              <Link
                href={TIERLIST_ROUTE}
                className={buttonClass("primary", "gap-[8px] px-[18px] py-[11px]")}
              >
                <Ranking size={17} />
                Create a tier list
              </Link>
              <Link
                href="#browse"
                className={buttonClass("secondary", "gap-[8px] px-[18px] py-[11px]")}
              >
                <SquaresFour size={16} />
                Browse published lists
              </Link>
              <Text variant="label" tone="faint" className="flex items-center gap-[7px]">
                <Lightning size={15} className="text-accent-400" />
                Saves to your device instantly
              </Text>
            </div>

            <dl className="mt-[34px] flex flex-wrap gap-[34px] border-t border-neutral-800 pt-[22px]">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <Text as="dt" variant="stat" className="block">
                    {stat.value}
                  </Text>
                  <Text as="dd" variant="label" tone="faint" className="mt-[2px] block max-w-[22ch]">
                    {stat.label}
                  </Text>
                </div>
              ))}
            </dl>
          </div>

          {/* The newest published board, not a mock-up. Hidden until one exists. */}
          {boards[0] ? (
            <div className="rounded-[13px] bg-surface p-[14px] shadow-lg">
              <Text variant="sectionLabel" tone="subtle" className="mb-[11px] block">
                Just published
              </Text>
              <BoardThumb rows={boards[0].preview} size="md" />
              <Text as="p" variant="label" tone="faint" className="mt-[10px] block truncate">
                {boards[0].title}
              </Text>
            </div>
          ) : null}
        </div>
      </section>

      <div className="mx-auto grid max-w-[1220px] grid-cols-1 items-start gap-[34px] px-[26px] pt-[36px] pb-[60px] lg:grid-cols-[minmax(0,1fr)_316px]">
        <main id="browse" className="min-w-0">
          <Text as="h2" variant="sectionTitle" className="mb-[16px] block">
            {query ? `Results for “${query}”` : "Recently published"}
          </Text>

          <div className="flex flex-col gap-[14px]">
            {boards.map((board) => (
              <BoardCard key={board.id} board={board} />
            ))}
          </div>

          {boards.length === 0 ? <EmptyFeed query={query} /> : null}
        </main>

        <FeedSidebar />
      </div>

      <SiteFooter />
    </div>
  );
}

function EmptyFeed({ query }: { query: string }) {
  return (
    <div className="rounded-[12px] border border-dashed border-neutral-800 p-[44px] text-center">
      <Text as="p" variant="bodySm" tone="dim" className="mb-[16px] block">
        {!convexConfigured
          ? "No backend is configured for this deployment, so nothing can be published yet."
          : query
            ? `No published tier list matches “${query}”.`
            : "Nothing has been published yet. The first public board shows up here."}
      </Text>
      {convexConfigured && !query ? (
        <Link href={TIERLIST_ROUTE} className={buttonClass("primary", "gap-[8px]")}>
          <Ranking size={16} />
          Build the first one
        </Link>
      ) : null}
    </div>
  );
}
