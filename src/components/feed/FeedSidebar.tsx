import Link from "next/link";
import {
  Cards,
  Megaphone,
  PlusCircle,
  Ranking,
  SquaresFour,
} from "@phosphor-icons/react/ssr";

import { buttonClass } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { Text } from "@/components/ui/Text";
import { CHANGELOG, TAG_TONE } from "@/lib/changelog";
import { CHANGELOG_ROUTE, MY_BOARDS_ROUTE, TIERLIST_ROUTE } from "@/lib/feed";

/**
 * Announcements, quick links, and the CTA.
 *
 * The design also carried a "most ranked this week" card. It is deliberately
 * not here: aggregating everyone's tiers into an average is on the
 * never-building list — a tier list is one person's opinion, and averaging
 * them makes this a review site (.docs/product/roadmap.md).
 */

const PANEL = "rounded-[12px] bg-surface p-[16px] shadow-sm";

const QUICK_LINKS = [
  { label: "New tier list", href: TIERLIST_ROUTE, icon: PlusCircle },
  { label: "My tier lists", href: MY_BOARDS_ROUTE, icon: Cards },
  { label: "Recently published", href: "/#browse", icon: SquaresFour },
];

export function FeedSidebar() {
  return (
    <aside className="flex flex-col gap-[16px] lg:sticky lg:top-[86px]">
      <section id="announcements" className={PANEL}>
        <div className="mb-[4px] flex items-center gap-[8px]">
          <Megaphone size={16} className="text-accent-400" />
          <Text variant="sectionLabel" tone="default">
            Announcements
          </Text>
        </div>

        {/* The head of the changelog, not a second hand-kept list. */}
        {CHANGELOG.slice(0, 3).map((item) => (
          <div key={item.title} className="border-t border-neutral-800 py-[11px]">
            <div className="mb-[4px] flex items-center gap-[8px]">
              <Text variant="caption" tone="faint" className="tracking-[0.04em] uppercase">
                {item.date}
              </Text>
              <Tag tone={TAG_TONE[item.kind]}>{item.kind}</Tag>
            </div>
            <Text variant="uiSm" className="mb-[3px] block leading-[1.35]">
              {item.title}
            </Text>
            <Text as="p" variant="label" tone="faint" className="block leading-[1.5]">
              {item.body}
            </Text>
          </div>
        ))}

        <Link
          href={CHANGELOG_ROUTE}
          className="block border-t border-neutral-800 pt-[11px] text-accent-300 hover:text-accent-200"
        >
          <Text variant="label" tone="inherit">
            Everything that’s changed →
          </Text>
        </Link>
      </section>

      <section className="rounded-[12px] bg-surface p-[10px] shadow-sm">
        <Text variant="sectionLabel" tone="subtle" className="block px-[10px] pt-[6px] pb-[8px]">
          Quick links
        </Text>
        <div className="flex flex-col gap-[2px]">
          {QUICK_LINKS.map(({ label, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center gap-[10px] rounded-[9px] px-[10px] py-[9px] text-neutral-200 transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent)_11%,transparent)] hover:text-accent-100"
            >
              <Icon size={17} className="text-accent-400" />
              <Text variant="uiSm" tone="inherit">
                {label}
              </Text>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[12px] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--color-accent)_16%,var(--color-surface)),var(--color-surface))] p-[16px] shadow-[0_0_0_1px_var(--color-accent-800)]">
        <Text variant="ui" className="mb-[5px] block font-semibold tracking-[-0.01em]">
          Got a ranking in you?
        </Text>
        <Text as="p" variant="label" tone="subtle" className="mb-[13px] block leading-[1.5]">
          Start an empty board and pull titles in from AniList — the catalog
          opens on trending, so the pool is never blank.
        </Text>
        <Link href={TIERLIST_ROUTE} className={buttonClass("primary", "w-full gap-[7px]")}>
          <Ranking size={16} />
          Start a board
        </Link>
      </section>
    </aside>
  );
}
