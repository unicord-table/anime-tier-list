import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CircleDashed,
  GitCommit,
  Path,
  WarningDiamond,
} from "@phosphor-icons/react/ssr";

import { SiteFooter, SiteHeader } from "@/components/feed/SiteChrome";
import { Tag } from "@/components/ui/Tag";
import { Text } from "@/components/ui/Text";
import {
  anchorOf,
  asFilter,
  commitUrl,
  DECISION_LOG_URL,
  entriesFor,
  FILTERS,
  jumpTargets,
  TAG_TONE,
  UPCOMING,
  type ChangeEntry,
  type ChangeFilter,
} from "@/lib/changelog";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Changelog — Unicord",
  description:
    "What has shipped, what broke and got fixed, and where the plan turned out wrong.",
};

/**
 * The changelog. The filter lives in the query string rather than in client
 * state, exactly like the feed's search: a filtered view is then linkable, and
 * the page ships no JavaScript of its own.
 */
export default async function ChangelogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const filter = asFilter((await searchParams).kind);
  const entries = entriesFor(filter);

  return (
    <div className="min-h-full bg-canvas text-ink">
      <SiteHeader active="changelog" />

      <main className="mx-auto w-full max-w-[1040px] px-[26px] pt-[44px] pb-[60px]">
        <div className="mb-[30px] max-w-[64ch]">
          <Tag tone="accent" className="mb-[14px]">
            Shipping in phases
          </Tag>
          <Text as="h1" variant="hero" className="mb-[12px] block text-[38px]">
            What’s changed
          </Text>
          <Text as="p" variant="body" tone="subtle" className="block text-pretty">
            Every phase ships something usable on its own. Corrections stay on
            the record rather than being quietly edited away — where a plan
            turned out wrong, the entry says so.
          </Text>
        </div>

        <div className="grid grid-cols-1 items-start gap-[40px] lg:grid-cols-[minmax(0,1fr)_232px]">
          <div className="min-w-0">
            <div className="mb-[26px] flex flex-wrap gap-[8px]">
              {FILTERS.map((f) => (
                <FilterChip key={f.key} filter={f.key} label={f.label} active={filter === f.key} />
              ))}
            </div>

            <div className="flex flex-col">
              {entries.map((entry) => (
                <Entry key={anchorOf(entry)} entry={entry} />
              ))}
            </div>

            {entries.length === 0 ? (
              <div className="rounded-[12px] border border-dashed border-neutral-800 p-[40px] text-center">
                <Text variant="bodySm" tone="dim">
                  Nothing under that filter yet.
                </Text>
              </div>
            ) : null}
          </div>

          <aside className="flex flex-col gap-[16px] lg:sticky lg:top-[84px]">
            <Roadmap />

            <section className={PANEL}>
              <Text variant="sectionLabel" className="mb-[11px] block">
                Jump to a phase
              </Text>
              <div className="flex flex-col">
                {jumpTargets(entries).map((target) => (
                  <Link
                    key={target.href}
                    href={target.href}
                    className="py-[5px] text-neutral-400 transition-colors hover:text-accent-200"
                  >
                    <Text variant="uiSm" tone="inherit">
                      {target.label}
                    </Text>
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-[12px] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--color-accent)_15%,var(--color-surface)),var(--color-surface))] p-[16px] shadow-[0_0_0_1px_var(--color-accent-800)]">
              <Text variant="ui" className="mb-[5px] block font-semibold tracking-[-0.01em]">
                Never shipping
              </Text>
              <Text as="p" variant="label" tone="subtle" className="mb-[11px] block leading-[1.55]">
                Image uploads, direct messages, and aggregate “official”
                rankings. A tier list is one person’s opinion — averaging it
                makes it a review site.
              </Text>
              <a
                href={DECISION_LOG_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-300 hover:text-accent-200"
              >
                <Text variant="label" tone="inherit">
                  Read the decision log
                </Text>
              </a>
            </section>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

const PANEL = "rounded-[12px] bg-surface p-[16px] shadow-sm";

/** A link, not a button — the filter is a URL, so it is one here too. */
function FilterChip({
  filter,
  label,
  active,
}: {
  filter: ChangeFilter;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={filter === "all" ? "/changelog" : `/changelog?kind=${filter}`}
      aria-current={active ? "true" : undefined}
      className={cn(
        "rounded-full border px-[12px] py-[6px] transition-colors",
        active
          ? "border-accent-700 bg-[color-mix(in_srgb,var(--color-accent)_15%,transparent)] text-accent-200"
          : "border-divider text-neutral-400 hover:border-accent-700 hover:text-ink",
      )}
    >
      <Text variant="uiSm" tone="inherit">
        {label}
      </Text>
    </Link>
  );
}

function Entry({ entry }: { entry: ChangeEntry }) {
  return (
    <div
      id={anchorOf(entry)}
      className="group grid scroll-mt-[96px] grid-cols-[72px_minmax(0,1fr)] gap-[20px] pb-[30px] sm:grid-cols-[104px_minmax(0,1fr)]"
    >
      <div className="pt-[1px] text-right">
        <Text variant="uiSm" tone="bright" className="block font-semibold">
          {entry.phase}
        </Text>
        <Text variant="caption" tone="faint" className="mt-[3px] block">
          {entry.kind === "Shipped" ? "shipped" : "record"}
        </Text>
      </div>

      <div className="relative border-l border-neutral-800 pb-[2px] pl-[26px]">
        <div className="absolute top-[5px] -left-[4.5px] h-[8px] w-[8px] rounded-full bg-neutral-700 transition-[background-color,box-shadow] group-hover:bg-accent group-hover:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-accent)_22%,transparent)]" />

        <div className="mb-[7px] flex flex-wrap items-center gap-[9px]">
          <Tag tone={TAG_TONE[entry.kind]} className="px-[8px] py-[1px] text-[10.5px]">
            {entry.kind}
          </Tag>
          <Text as="h2" variant="title" className="block">
            {entry.title}
          </Text>
        </div>

        <Text as="p" variant="bodySm" tone="subtle" className="mb-[11px] block text-pretty">
          {entry.body}
        </Text>

        {entry.points?.length ? (
          <ul className="mb-[11px] flex list-disc flex-col gap-[5px] pl-[17px]">
            {entry.points.map((point) => (
              <li key={point}>
                <Text variant="bodySm" tone="dim">
                  {point}
                </Text>
              </li>
            ))}
          </ul>
        ) : null}

        {entry.note ? (
          <div className="flex gap-[10px] rounded-[10px] bg-surface px-[13px] py-[11px] shadow-sm">
            <WarningDiamond size={16} className="mt-[1px] shrink-0 text-accent-400" />
            <Text as="p" variant="label" tone="dim" className="block leading-[1.55] text-pretty">
              {entry.note}
            </Text>
          </div>
        ) : null}

        {entry.commit ? (
          <a
            href={commitUrl(entry.commit)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-[10px] inline-flex items-center gap-[8px] text-neutral-600 transition-colors hover:text-accent-300"
            aria-label={`Commit ${entry.commit} on GitHub`}
          >
            <GitCommit size={14} />
            <code className="rounded-[5px] bg-canvas px-[6px] py-[1px] font-mono text-[11.5px] text-neutral-300 shadow-sm">
              {entry.commit}
            </code>
          </a>
        ) : null}
      </div>
    </div>
  );
}

function Roadmap() {
  return (
    <section className={PANEL}>
      <div className="mb-[12px] flex items-center gap-[8px]">
        <Path size={16} className="text-accent-400" />
        <Text variant="sectionLabel">What’s next</Text>
      </div>

      <div className="flex flex-col gap-[13px]">
        {UPCOMING.map((item) => (
          <div key={item.title}>
            <div className="mb-[3px] flex items-center gap-[8px]">
              {item.next ? (
                <ArrowRight size={13} className="shrink-0 text-accent-400" />
              ) : (
                <CircleDashed size={13} className="shrink-0 text-neutral-500" />
              )}
              <Text variant="uiSm" tone="bright">
                {item.title}
              </Text>
            </div>
            <Text as="p" variant="caption" tone="faint" className="block pl-[21px] leading-[1.5]">
              {item.body}
            </Text>
          </div>
        ))}
      </div>

      <Text
        as="p"
        variant="caption"
        tone="ghost"
        className="mt-[14px] block border-t border-neutral-800 pt-[12px] leading-[1.5]"
      >
        Phases are ordered by dependency, not by date. There are no dates.
      </Text>
    </section>
  );
}
