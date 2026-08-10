import Link from "next/link";
import { MagnifyingGlass, Plus, Ranking } from "@phosphor-icons/react/ssr";

import { AccountMenu } from "@/components/auth/AccountMenu";
import { buttonClass } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { TextInput } from "@/components/ui/TextInput";
import { REPO_URL } from "@/lib/changelog";
import { cn } from "@/lib/cn";
import { CHANGELOG_ROUTE, MY_BOARDS_ROUTE, TIERLIST_ROUTE } from "@/lib/feed";

/**
 * Header and footer for the scrolling public pages. The editor keeps its own
 * `board/AppHeader` — that one is an app-shell toolbar with the board title in
 * it, and merging the two would give each page half the other's controls.
 *
 * Search is a plain GET form and the sort tabs are links, so the whole landing
 * page renders on the server with no client bundle beyond `AccountMenu`.
 */

const NAV = [
  { key: "feed", label: "Feed", href: "/" },
  { key: "mine", label: "My tier lists", href: MY_BOARDS_ROUTE },
  { key: "changelog", label: "Changelog", href: CHANGELOG_ROUTE },
] as const;

/** Which nav item is lit. Every page passes its own — no page defaults to Feed. */
export type NavKey = (typeof NAV)[number]["key"];

export function SiteHeader({ query = "", active }: { query?: string; active?: NavKey }) {
  return (
    <header className="sticky top-0 z-40 flex flex-wrap items-center gap-x-[22px] gap-y-[10px] border-b border-divider bg-[color-mix(in_srgb,var(--color-canvas)_88%,transparent)] px-[26px] py-[13px] backdrop-blur-[10px]">
      <Link href="/" className="flex items-center gap-[9px] text-ink">
        <div className="flex h-[30px] w-[30px] items-center justify-center rounded-md bg-[linear-gradient(150deg,var(--color-accent-500),var(--color-accent-800))] shadow-[0_0_0_1px_var(--color-accent-700)]">
          <Ranking weight="fill" size={18} className="text-accent-100" />
        </div>
        <Text variant="ui" className="font-semibold tracking-[-0.01em]">
          Unicord
        </Text>
      </Link>

      <nav aria-label="Primary" className="hidden items-center gap-[20px] md:flex">
        {NAV.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active === item.key ? "page" : undefined}
            className={cn(
              "border-b py-[6px] transition-colors",
              active === item.key
                ? "border-accent text-ink"
                : "border-transparent text-neutral-400 hover:border-accent hover:text-ink",
            )}
          >
            <Text variant="uiSm" tone="inherit">
              {item.label}
            </Text>
          </Link>
        ))}
      </nav>

      <div className="flex-1" />

      {/* GET to `/` — the page reads `q` off searchParams and the feed query
          runs it through the tierlists title search index. */}
      <form action="/" role="search" className="relative w-full sm:w-[250px]">
        <MagnifyingGlass
          size={15}
          className="pointer-events-none absolute top-1/2 left-[10px] -translate-y-1/2 text-neutral-500"
        />
        <TextInput
          variant="search"
          type="search"
          name="q"
          defaultValue={query}
          aria-label="Search published tier lists"
          placeholder="Search published tier lists…"
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
      { label: "My tier lists", href: MY_BOARDS_ROUTE },
    ],
  },
  {
    heading: "Explore",
    links: [
      { label: "Recently published", href: "/#browse" },
      { label: "Changelog", href: CHANGELOG_ROUTE },
    ],
  },
  {
    heading: "Site",
    links: [{ label: "GitHub", href: REPO_URL }],
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
              Unicord
            </Text>
          </div>
          <Text as="p" variant="label" tone="faint" className="block max-w-[34ch]">
            Tier lists for anime, built in the browser. Boards stay on your
            device until you publish one.
          </Text>
        </div>

        {FOOTER_GROUPS.map((group) => (
          <nav key={group.heading} aria-label={group.heading} className="flex flex-col gap-[8px]">
            <Text variant="eyebrow" tone="faint">
              {group.heading}
            </Text>
            {group.links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                // The GitHub link leaves the site; the rest are internal.
                {...(link.href.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="text-accent-300 hover:text-accent-200"
              >
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
