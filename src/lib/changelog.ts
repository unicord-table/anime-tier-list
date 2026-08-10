/**
 * The changelog. Hand-written, but every entry is anchored to a real commit in
 * https://github.com/unicord-table/anime-tier-list — the hashes below come out
 * of `git log`, not out of the air.
 *
 * Corrections stay on the record instead of being edited away: where the plan
 * in `.docs/product/roadmap.md` turned out wrong, the entry says so. That is
 * why `kind` has `Correction` in it at all.
 *
 * This is also the source the landing page's Announcements panel reads, so the
 * two can't drift.
 */

export const REPO_URL = "https://github.com/unicord-table/anime-tier-list";

/** `HEAD` resolves to the default branch, so this survives a rename. */
export const DECISION_LOG_URL = `${REPO_URL}/blob/HEAD/.docs/decisions.md`;

export const commitUrl = (hash: string) => `${REPO_URL}/commit/${hash}`;

export type ChangeKind = "Shipped" | "Fix" | "Correction";

export type ChangeEntry = {
  kind: ChangeKind;
  phase: string;
  /** Commit date, for the landing page's announcement list. */
  date: string;
  title: string;
  body: string;
  points?: readonly string[];
  /** A consequence worth admitting to. Rendered in the warning box. */
  note?: string;
  /** Short hash. Corrections that describe a plan, not a change, have none. */
  commit?: string;
};

export const CHANGELOG: readonly ChangeEntry[] = [
  {
    kind: "Shipped",
    phase: "Phase 4",
    date: "Aug 10",
    title: "Share links, remix, and a page for every board",
    body: "A published board gets a permanent link, server-rendered from one read — no catalog API calls on the public page.",
    points: [
      "Publish dialog with title, description and public / unlisted / private",
      "Remix opens anyone’s board as your own copy",
      "/tierlists lists what you have published, with copy-link, edit and delete",
    ],
    note: "Shipped before Phase 2, which is the one thing the plan said not to do: published documents now have to be backfilled when the generalized item model lands, instead of the migration being a pure client-side function.",
    commit: "f3972d2",
  },
  {
    kind: "Shipped",
    phase: "Phase 1.6",
    date: "Aug 10",
    title: "The editor moved to /tierlist and / became a feed",
    body: "A newsfeed-style landing page: hero, chronological feed of recently published boards, announcements, quick links.",
    points: [
      "Server-rendered, with the search term in the query string",
      "Sort tabs are plain links, so the page needs no client bundle",
    ],
    commit: "c3236ed",
  },
  {
    kind: "Fix",
    phase: "Phase 1.6",
    date: "Aug 10",
    title: "The Share and PNG buttons had invisible borders",
    body: "The button base set a transparent border that silently beat every variant’s. A property now belongs to exactly one layer: if variants set it, the base must not.",
    commit: "c3236ed",
  },
  {
    kind: "Shipped",
    phase: "Phase 1.5",
    date: "Aug 8",
    title: "Optional sign-in with Google and GitHub",
    body: "Accounts gate nothing except publishing. The app still runs with no backend configured — the account UI simply hides itself.",
    commit: "9b5d0eb",
  },
  {
    kind: "Correction",
    phase: "Phase 1",
    date: "Aug 2",
    title: "Tier reordering shipped after all",
    body: "It was listed as deliberately skipped. It is in the build: drag a row by its label, or use the arrows.",
    commit: "11405ee",
  },
  {
    kind: "Fix",
    phase: "Phase 1",
    date: "Aug 2",
    title: "Covers stopped failing at random",
    body: "Cover art is only sent cross-origin headers when the request carries an Origin, and the browser cache does not key on request mode — so a cached copy poisoned every later load. One cache-busting retry clears it.",
    commit: "5367350",
  },
  {
    kind: "Correction",
    phase: "Phase 1",
    date: "Aug 1",
    title: "The catalog is a drag source, not a drop target",
    body: "Results come from the API, so “drag a title back into the results” means nothing. Removal happens on the card and in the detail modal instead.",
    points: [
      "The catalog shows trending when the box is empty, so the grid is never blank",
      "The tool rail’s last slot is Load save file, not a settings gear",
    ],
  },
  {
    kind: "Shipped",
    phase: "Phase 1",
    date: "Aug 1",
    title: "The editor, end to end and entirely client-side",
    body: "Search a real catalog, drag titles into tiers, undo, autosave, export. The whole product for a single user, with no account.",
    points: [
      "Drag between any row and the pool, and reorder within a row",
      "Detail modal per cover: synopsis, score, studio, genres, outbound links",
      "Autosave to this device, plus .json export and import",
      "Export a PNG of the whole board",
    ],
    commit: "d9ae800",
  },
  {
    kind: "Shipped",
    phase: "Phase 0",
    date: "Aug 1",
    title: "Scaffold",
    body: "Next.js 16 App Router, TypeScript, Tailwind v4, dnd-kit, deployed.",
    note: "The plan required an `images.remotePatterns` entry for s4.anilist.co. It was never needed — the app uses plain <img>, not next/image.",
    commit: "69cfe31",
  },
];

/** Sidebar headings, so a jump link reads as more than "Phase 1.6". */
const PHASE_NAMES: Record<string, string> = {
  "Phase 4": "Share links",
  "Phase 1.6": "Landing page",
  "Phase 1.5": "Sign-in",
  "Phase 1": "The editor",
  "Phase 0": "Scaffold",
};

export const FILTERS = [
  { key: "all", label: "Everything" },
  { key: "Shipped", label: "Shipped" },
  { key: "Fix", label: "Fixes" },
  { key: "Correction", label: "Corrections" },
] as const;

export type ChangeFilter = (typeof FILTERS)[number]["key"];

/** `?kind=` is user input. Anything unrecognised falls back to everything. */
export function asFilter(value: unknown): ChangeFilter {
  return FILTERS.some((f) => f.key === value) ? (value as ChangeFilter) : "all";
}

export function entriesFor(filter: ChangeFilter): readonly ChangeEntry[] {
  return filter === "all" ? CHANGELOG : CHANGELOG.filter((e) => e.kind === filter);
}

/** Stable anchor for an entry, by its position in the full changelog. */
export const anchorOf = (entry: ChangeEntry) => `entry-${CHANGELOG.indexOf(entry)}`;

/**
 * One jump link per phase, pointing at that phase's first *visible* entry —
 * so the sidebar never links to something the filter has hidden.
 */
export function jumpTargets(entries: readonly ChangeEntry[]) {
  const seen = new Set<string>();
  return entries.flatMap((entry) => {
    if (seen.has(entry.phase)) return [];
    seen.add(entry.phase);
    const name = PHASE_NAMES[entry.phase];
    return [{ label: name ? `${entry.phase} — ${name}` : entry.phase, href: `#${anchorOf(entry)}` }];
  });
}

/** Nocturne tag tones, one kind to one tone. Shared with the feed sidebar. */
export const TAG_TONE: Record<ChangeKind, "accent" | "neutral" | "outline"> = {
  Shipped: "accent",
  Fix: "neutral",
  Correction: "outline",
};

export type Upcoming = {
  title: string;
  body: string;
  /** The first one is the one being worked on. */
  next?: boolean;
};

/** From `.docs/product/roadmap.md`. Ordered by dependency, not by date. */
export const UPCOMING: readonly Upcoming[] = [
  {
    title: "Generalize the item model",
    body: "Any topic, not just anime. A breaking change to the saved shape, so it ships alone.",
    next: true,
  },
  {
    title: "Catalog source registry",
    body: "Then custom items — the first moment a non-anime board is possible.",
  },
  {
    title: "Profiles and identity",
    body: "A handle, and one URL for everything you have ranked.",
  },
  {
    title: "The social layer",
    body: "Follows, likes, comments — in that order. Discovery ships with the feed, not after.",
  },
];
