import Link from "next/link";
import { Lightning, Ranking, SquaresFour } from "@phosphor-icons/react/ssr";

import { BoardThumb } from "@/components/feed/BoardThumb";
import { FeaturedCard, FeedCard } from "@/components/feed/FeedCards";
import { FeedSidebar } from "@/components/feed/FeedSidebar";
import { SiteFooter, SiteHeader } from "@/components/feed/SiteChrome";
import { buttonClass } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { Text } from "@/components/ui/Text";
import { cn } from "@/lib/cn";
import {
  FEATURED_POSTS,
  FEED_POSTS,
  FEED_SORTS,
  HERO_BOARD,
  TIERLIST_ROUTE,
  feedHref,
  selectPosts,
  toFeedSort,
} from "@/lib/feed";

/**
 * The landing page. A scrolling document, server-rendered: search and sort
 * travel in the query string rather than in client state, so the feed is
 * crawlable, linkable, and costs no JavaScript. The editor lives at
 * `/tierlist` — this route used to be it.
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
  const sort = toFeedSort(params.sort);
  const posts = selectPosts(FEED_POSTS, { query, sort });

  return (
    <div className="min-h-full bg-canvas text-ink">
      <SiteHeader query={query} sort={sort} />

      <section className="relative overflow-hidden border-b border-divider">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-[140px] -left-[60px] h-[340px] w-[520px] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-accent)_22%,transparent),transparent)] blur-[18px]"
        />
        <div className="relative mx-auto grid max-w-[1220px] grid-cols-1 items-center gap-[48px] px-[26px] pt-[52px] pb-[44px] lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <Tag tone="accent" className="mb-[16px]">
              The editor is live — publishing is next
            </Tag>
            <Text as="h1" variant="hero" className="mb-[14px] block max-w-[15ch]">
              Everyone&rsquo;s anime rankings, in one feed.
            </Text>
            <Text as="p" variant="body" tone="subtle" className="mb-[26px] block max-w-[52ch] text-pretty">
              Build a board in a minute, drag titles straight out of AniList, and
              take it away as a PNG or a save file. No account needed to start.
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
                Browse all lists
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

          <div className="rounded-[13px] bg-surface p-[14px] shadow-lg">
            <div className="mb-[11px] flex items-center justify-between">
              <Text variant="sectionLabel" tone="subtle">
                What a board looks like
              </Text>
            </div>
            <BoardThumb rows={HERO_BOARD} size="lg" />
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1220px] grid-cols-1 items-start gap-[34px] px-[26px] pt-[36px] pb-[60px] lg:grid-cols-[minmax(0,1fr)_316px]">
        <main id="browse" className="min-w-0">
          <div className="mb-[14px] flex items-baseline justify-between">
            <Text as="h2" variant="sectionTitle">
              Featured this week
            </Text>
          </div>
          <div className="mb-[36px] grid grid-cols-1 gap-[16px] md:grid-cols-2">
            {FEATURED_POSTS.map((post) => (
              <FeaturedCard key={post.id} post={post} />
            ))}
          </div>

          <div className="mb-[6px] flex flex-wrap items-center gap-[12px]">
            <Text as="h2" variant="sectionTitle">
              From the feed
            </Text>
            <div className="flex-1" />
            {/* Links, not tabs: each one is a navigation to a different URL,
                and `Segmented` is for controlled state in a client component. */}
            <nav
              aria-label="Sort the feed"
              className="flex rounded-[9px] border border-divider bg-surface p-[3px]"
            >
              {FEED_SORTS.map((option) => (
                <Link
                  key={option}
                  aria-current={option === sort ? "page" : undefined}
                  href={feedHref({ sort: option, query })}
                  className={cn(
                    "rounded-[6px] px-[12px] py-[6px] capitalize transition-colors",
                    option === sort
                      ? "bg-[color-mix(in_srgb,var(--color-accent)_16%,transparent)] text-accent-200"
                      : "text-neutral-400 hover:text-neutral-300",
                  )}
                >
                  <Text variant="uiSm" tone="inherit">
                    {option}
                  </Text>
                </Link>
              ))}
            </nav>
          </div>

          <Text as="p" variant="label" tone="faint" className="mb-[16px] block">
            Sample boards, shown so the feed has a shape. Real ones appear here
            once publishing ships — see the changelog.
          </Text>

          <div className="flex flex-col gap-[14px]">
            {posts.map((post) => (
              <FeedCard key={post.id} post={post} />
            ))}
          </div>

          {posts.length === 0 ? (
            <div className="rounded-[12px] border border-dashed border-neutral-800 p-[44px] text-center">
              <Text variant="bodySm" tone="dim">
                {sort === "following" && !query
                  ? "Following is empty until you follow someone — that lands with profiles."
                  : `Nothing matches “${query}”. Try another title or handle.`}
              </Text>
            </div>
          ) : null}
        </main>

        <FeedSidebar />
      </div>

      <SiteFooter />
    </div>
  );
}
