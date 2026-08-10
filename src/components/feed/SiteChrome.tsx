import Link from "next/link";
import { MagnifyingGlass, Plus, Ranking } from "@phosphor-icons/react/ssr";

import { AccountMenu } from "@/components/auth/AccountMenu";
import { buttonClass } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { TextInput } from "@/components/ui/TextInput";
import { TIERLIST_ROUTE, type FeedSort } from "@/lib/feed";

/**
 * Header and footer for the scrolling public pages. The editor keeps its own
 * `board/AppHeader` — that one is an app-shell toolbar with the board title in
 * it, and merging the two would give each page half the other's controls.
 *
 * Search is a plain GET form and the sort tabs are links, so the whole landing
 * page renders on the server with no client bundle beyond `AccountMenu`.
 */

const NAV_LINK =
  "border-b border-transparent py-[6px] text-neutral-400 transition-colors hover:border-accent hover:text-ink";

export function SiteHeader({ query = "", sort }: { query?: string; sort?: FeedSort }) {
  return (
    <header className="sticky top-0 z-40 flex flex-wrap items-center gap-x-[22px] gap-y-[10px] border-b border-divider bg-[color-mix(in_srgb,var(--color-canvas)_88%,transparent)] px-[26px] py-[13px] backdrop-blur-[10px]">
      <Link href="/" className="flex items-center gap-[9px] text-ink">
        <div className="flex h-[30px] w-[30px] items-center justify-center rounded-md bg-[linear-gradient(150deg,var(--color-accent-500),var(--color-accent-800))] shadow-[0_0_0_1px_var(--color-accent-700)]">
          <Ranking weight="fill" size={18} className="text-accent-100" />
        </div>
        <Text variant="ui" className="font-semibold tracking-[-0.01em]">
          Tierist
        </Text>
      </Link>

      <nav aria-label="Primary" className="hidden items-center gap-[20px] md:flex">
        <Link href="/" className="border-b border-accent py-[6px] text-ink">
          <Text variant="uiSm" tone="inherit">
            Feed
          </Text>
        </Link>
        <Link href="/#browse" className={NAV_LINK}>
          <Text variant="uiSm" tone="inherit">
            Browse
          </Text>
        </Link>
        <Link href="/#announcements" className={NAV_LINK}>
          <Text variant="uiSm" tone="inherit">
            Changelog
          </Text>
        </Link>
      </nav>

      <div className="flex-1" />

      {/* GET to `/` — the page reads `q` off searchParams and filters server-side. */}
      <form action="/" role="search" className="relative w-full sm:w-[250px]">
        {sort && sort !== "latest" ? (
          <input type="hidden" name="sort" value={sort} />
        ) : null}
        <MagnifyingGlass
          size={15}
          className="pointer-events-none absolute top-1/2 left-[10px] -translate-y-1/2 text-neutral-500"
        />
        <TextInput
          variant="search"
          type="search"
          name="q"
          defaultValue={query}
          aria-label="Search tier lists"
          placeholder="Search lists, people, titles…"
        />
      </form>

      <AccountMenu />

      <Link href={TIERLIST_ROUTE} className={buttonClass("primary", "gap-[7px]")}>
        <Plus size={14} weight="bold" />
        New tier list
      </Link>
    </header>
  );
}

const FOOTER_GROUPS = [
  {
    heading: "Make",
    links: [
      { label: "New tier list", href: TIERLIST_ROUTE },
      { label: "Import from AniList", href: TIERLIST_ROUTE },
    ],
  },
  {
    heading: "Explore",
    links: [
      { label: "Featured lists", href: "/#browse" },
      { label: "Changelog", href: "/#announcements" },
    ],
  },
  {
    heading: "Site",
    links: [
      { label: "GitHub", href: "https://github.com/unicord-table/anime-tier-list" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-divider">
      <div className="mx-auto flex max-w-[1220px] flex-wrap items-start gap-[56px] px-[26px] pt-[28px] pb-[40px]">
        <div className="min-w-[220px]">
          <div className="mb-[9px] flex items-center gap-[9px]">
            <div className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-[linear-gradient(150deg,var(--color-accent-500),var(--color-accent-800))]">
              <Ranking weight="fill" size={15} className="text-accent-100" />
            </div>
            <Text variant="uiSm" className="font-semibold">
              Tierist
            </Text>
          </div>
          <Text as="p" variant="label" tone="faint" className="block max-w-[34ch]">
            Tier lists for anime, built in the browser. Boards stay on your device
            until publishing ships.
          </Text>
        </div>

        {FOOTER_GROUPS.map((group) => (
          <nav key={group.heading} aria-label={group.heading} className="flex flex-col gap-[8px]">
            <Text variant="eyebrow" tone="faint">
              {group.heading}
            </Text>
            {group.links.map((link) => (
              <Link key={link.label} href={link.href} className="text-accent-300 hover:text-accent-200">
                <Text variant="label" tone="inherit">
                  {link.label}
                </Text>
              </Link>
            ))}
          </nav>
        ))}
      </div>
    </footer>
  );
}
