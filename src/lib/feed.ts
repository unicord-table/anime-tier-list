/**
 * The feed's URL shape. Posts come from `api.tierlists.feed` — there is no
 * sample content here. The announcements the sidebar shows are the top of the
 * changelog, in `lib/changelog.ts`.
 */

/** The editor. One constant so nav, CTAs and cards cannot drift apart. */
export const TIERLIST_ROUTE = "/tierlist";
export const MY_BOARDS_ROUTE = "/tierlists";
export const CHANGELOG_ROUTE = "/changelog";

/** Canonical feed URL. An empty query is the default, so it stays off. */
export function feedHref(query?: string): string {
  const trimmed = query?.trim();
  return trimmed ? `/?q=${encodeURIComponent(trimmed)}` : "/";
}

/** How many boards one feed page asks for. */
export const FEED_PAGE = 12;
