/**
 * Landing-page announcements and the feed's URL shape.
 *
 * The posts themselves come from `api.tierlists.feed` — there is no sample
 * content here any more. Announcements stay hand-written: they are a changelog,
 * not user data, and every entry below is a real shipped or planned change.
 */

/** The editor. One constant so nav, CTAs and cards cannot drift apart. */
export const TIERLIST_ROUTE = "/tierlist";
export const MY_BOARDS_ROUTE = "/tierlists";

/** Canonical feed URL. An empty query is the default, so it stays off. */
export function feedHref(query?: string): string {
  const trimmed = query?.trim();
  return trimmed ? `/?q=${encodeURIComponent(trimmed)}` : "/";
}

/** How many boards one feed page asks for. */
export const FEED_PAGE = 12;

export type Announcement = {
  date: string;
  kind: "Shipped" | "Planned";
  title: string;
  body: string;
};

export const ANNOUNCEMENTS: readonly Announcement[] = [
  {
    date: "Aug 10",
    kind: "Shipped",
    title: "Publish a board and share the link",
    body: "Give it a title and a description, pick who can see it, and get a permanent URL.",
  },
  {
    date: "Aug 8",
    kind: "Shipped",
    title: "Optional Google and GitHub sign-in",
    body: "Boards still save to this device without one — an account is what publishing needs.",
  },
  {
    date: "Next",
    kind: "Planned",
    title: "Profiles, follows and likes",
    body: "Once there are boards to follow, the feed gets more than reverse-chronological.",
  },
];
