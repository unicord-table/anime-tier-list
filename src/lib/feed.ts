import { TIER_PRESET_COLORS } from "./board.ts";

/**
 * Landing-page feed: the shape of a post, the pure selection logic, and the
 * sample content the page renders today.
 *
 * **The posts below are samples, and the page says so on screen.** Publishing
 * does not exist yet — boards live in `localStorage` and there is no
 * `tierlists` table (roadmap Phase 4, then the feed itself in Phase 6). Rather
 * than invent a Convex query over data nobody writes, the page renders this
 * module and labels the section. When `feed.home` lands it returns `FeedPost[]`
 * and `selectPosts` becomes the query's `.filter`/`.order` — the components
 * above it do not change.
 *
 * Everything here is pure and dependency-free, so `feed.test.ts` runs it under
 * plain `node --test` the same way `board.test.ts` runs `board.ts`.
 */

export const FEED_SORTS = ["latest", "trending", "following"] as const;
export type FeedSort = (typeof FEED_SORTS)[number];

/** Search params are `string | string[] | undefined`; anything unrecognised is `latest`. */
export const toFeedSort = (value: string | string[] | undefined): FeedSort =>
  FEED_SORTS.includes(value as FeedSort) ? (value as FeedSort) : "latest";

export type FeedPost = {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  handle: string;
  /**
   * Seeds the author avatar and the board swatches. Stands in for cover art
   * until boards are published — see [D6](../../.docs/decisions.md#d6): the app
   * never hosts uploaded images, so a preview is generated, not fetched.
   */
  hue: number;
  time: string;
  likes: number;
  comments: number;
  views: string;
  tags: string[];
  /** Shows the "New" chip. */
  fresh?: boolean;
  following?: boolean;
  /** Badge text. Its presence is what marks a post as featured. */
  featured?: string;
  /** Hues per tier row, top tier first. Drives `<BoardThumb>`. */
  spec: number[][];
};

export type ThumbRow = { label: string; color: string; cells: string[] };

/** Matches `createEmptySave`'s default rows, so a preview looks like a board. */
const TIER_LABELS = ["S", "A", "B", "C", "D", "F"];

export const coverGradient = (hue: number) =>
  `linear-gradient(155deg, hsl(${hue} 46% 44%), hsl(${(hue + 38) % 360} 42% 18%))`;

export const avatarGradient = (hue: number) =>
  `linear-gradient(150deg, hsl(${hue} 40% 46%), hsl(${(hue + 40) % 360} 38% 26%))`;

export function thumbRows(spec: number[][]): ThumbRow[] {
  return spec.slice(0, TIER_LABELS.length).map((hues, i) => ({
    label: TIER_LABELS[i],
    color: TIER_PRESET_COLORS[i],
    cells: hues.map(coverGradient),
  }));
}

export const titleCount = (post: FeedPost): number =>
  post.spec.reduce((n, row) => n + row.length, 0);

/**
 * Filter by free text, then order. `latest` keeps source order, which is
 * already reverse-chronological — the feed is chronological on purpose, see
 * [social-feed.md](../../.docs/architecture/social-feed.md#ranking).
 */
export function selectPosts(
  posts: readonly FeedPost[],
  { query = "", sort = "latest" }: { query?: string; sort?: FeedSort } = {},
): FeedPost[] {
  const q = query.trim().toLowerCase();
  const list = posts.filter(
    (p) =>
      !q ||
      `${p.title} ${p.author} ${p.handle} ${p.tags.join(" ")}`.toLowerCase().includes(q),
  );
  // `filter` already handed back a fresh array, so sorting in place is safe.
  if (sort === "trending") return list.sort((a, b) => b.likes - a.likes);
  if (sort === "following") return list.filter((p) => p.following);
  return list;
}

/** The editor. One constant so nav, CTAs and cards cannot drift apart. */
export const TIERLIST_ROUTE = "/tierlist";

/**
 * Where a feed card points. Every sample board sends you to the editor,
 * because published boards have no URL yet. It becomes `/t/${post.slug}` in
 * roadmap Phase 4 — until then there is nothing to read off a post, so it
 * takes nothing.
 */
export const postHref = (): string => TIERLIST_ROUTE;

/** Canonical feed URL. `latest` and an empty query are the defaults, so they stay off. */
export function feedHref({ sort, query }: { sort?: FeedSort; query?: string } = {}): string {
  const params = new URLSearchParams();
  if (query?.trim()) params.set("q", query.trim());
  if (sort && sort !== "latest") params.set("sort", sort);
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

/* ── sample content ─────────────────────────────────────────────────────── */

export const FEED_POSTS: readonly FeedPost[] = [
  {
    id: "p1",
    author: "Ronin Static",
    handle: "@ronin_static",
    hue: 265,
    time: "18m ago",
    likes: 342,
    comments: 61,
    views: "4.2k",
    fresh: true,
    following: true,
    featured: "Featured",
    title: "Best Anime of the Decade",
    excerpt:
      "Ten years, forty-two shows, one hill I will die on: Starbound Oath belongs in S and nothing you say will move it.",
    tags: ["Decade", "All-time"],
    spec: [
      [45, 340],
      [265, 285, 320],
      [150, 12, 130],
      [20, 210],
      [350],
    ],
  },
  {
    id: "p2",
    author: "Paper Lantern",
    handle: "@paperlantern",
    hue: 30,
    time: "1h ago",
    likes: 289,
    comments: 44,
    views: "3.1k",
    featured: "Editor's pick",
    title: "Every studio film, ranked by how much I cried",
    excerpt:
      "A completely objective ranking of twenty-four features by tissue count. The last three are basically a tie.",
    tags: ["Films", "Comfort watch"],
    spec: [
      [30, 195],
      [150, 45, 320],
      [12, 230],
      [190, 300, 8],
      [38],
    ],
  },
  {
    id: "p3",
    author: "Azure Protocol",
    handle: "@azure_p",
    hue: 205,
    time: "3h ago",
    likes: 176,
    comments: 28,
    views: "2.4k",
    fresh: true,
    following: true,
    title: "Summer 2026, three episodes in",
    excerpt:
      "Early read on the season. Tidal Cipher is the sleeper — the direction in episode two is doing things nothing else this year is trying.",
    tags: ["Seasonal", "Summer 2026"],
    spec: [
      [190],
      [205, 275],
      [285, 15, 130],
      [20, 350],
      [8, 300],
    ],
  },
  {
    id: "p4",
    author: "Echo Garden",
    handle: "@echo_garden",
    hue: 150,
    time: "6h ago",
    likes: 118,
    comments: 19,
    views: "1.6k",
    title: "Openings only: the S-tier is bigger than you think",
    excerpt:
      "Ranked purely on the 90 seconds before the show starts. Yes, that is a legitimate category.",
    tags: ["Music", "Openings"],
    spec: [
      [45, 265, 320],
      [130, 12],
      [230, 190],
      [275],
      [15, 350],
    ],
  },
  {
    id: "p5",
    author: "Glass Empire",
    handle: "@glassempire",
    hue: 220,
    time: "9h ago",
    likes: 96,
    comments: 12,
    views: "1.1k",
    following: true,
    title: "Mecha, sorted by how much the pilot deserved it",
    excerpt:
      "A niche axis, but a rigorous one. Zero Divide sits alone at the top and it is not close.",
    tags: ["Mecha", "Hot take"],
    spec: [
      [210],
      [250, 220],
      [12, 20, 205],
      [180, 130],
      [340],
    ],
  },
  {
    id: "p6",
    author: "Midnight Ramen",
    handle: "@mdnt_ramen",
    hue: 15,
    time: "14h ago",
    likes: 74,
    comments: 9,
    views: "980",
    title: "Food anime, ranked by whether I got up and cooked",
    excerpt:
      "Three of these sent me to the kitchen at 1am. That is the whole methodology.",
    tags: ["Food", "Cozy"],
    spec: [
      [15, 38],
      [30, 45],
      [130, 320],
      [190],
      [230, 275],
    ],
  },
];

export const FEATURED_POSTS = FEED_POSTS.filter((p) => p.featured);

/** The board rendered beside the hero copy. */
export const HERO_BOARD = thumbRows([
  [45, 340, 265],
  [285, 320, 12, 150],
  [130, 20, 210],
  [190, 350],
  [230, 300, 8],
]);

export type Announcement = {
  date: string;
  kind: "Shipped" | "Planned";
  title: string;
  body: string;
};

/**
 * Real entries only — each one maps to a shipped phase or a roadmap item, so
 * the changelog stays true as the product catches up with the page.
 */
export const ANNOUNCEMENTS: readonly Announcement[] = [
  {
    date: "Aug 8",
    kind: "Shipped",
    title: "Optional Google and GitHub sign-in",
    body: "Accounts are additive — boards still save to this device without one.",
  },
  {
    date: "Aug 2",
    kind: "Shipped",
    title: "Import a public AniList profile",
    body: "One request pulls a whole list into the pool. Tested past 1,200 titles.",
  },
  {
    date: "Next",
    kind: "Planned",
    title: "Share links and published boards",
    body: "A board gets its own URL, and this feed starts showing real ones.",
  },
];
