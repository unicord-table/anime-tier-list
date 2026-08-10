# Product vision

**Status: direction, not commitment.** This page states what the product is
becoming so architecture decisions have something to aim at. Nothing here is
built. Dates and priorities live in [roadmap.md](roadmap.md).

## One line

A social platform for tier lists on any topic — where the ranking tool is good
enough to use on its own, and every finished list is a link you can send anyone.

## What changed

The repo is named `anime-tier-list` and shipped as one: an AniList-backed anime
ranker that saves to `localStorage`. Two things about the scope have since
changed, and both invalidate earlier decisions:

| Was | Now |
| --- | --- |
| Anime only | Any topic — games, film, music, and user-defined items |
| "Comments / likes / feeds: never, probably — that's a different product" | The feed **is** the product's second half |
| Share links as a nice-to-have Phase 2 | Share links are the core loop |

Superseded decisions are recorded in [decisions.md](../decisions.md) as
[D12](../decisions.md#d12) and [D13](../decisions.md#d13) rather than quietly
edited away, so the reasoning trail stays intact.

## The three pillars

### 1. The editor — the reason anyone shows up

The tier list itself has to be the best part. It already mostly is: drag and
drop that works on touch and keyboard, a real catalog behind the search box,
undo, autosave, PNG export.

**This must never regress in service of the social features.** The failure mode
for this category of product is a mediocre tool wrapped in engagement
mechanics. The editor stays usable signed-out, offline-ish, and with no account.

### 2. The link — how it spreads

A finished tier list is a URL. Not a screenshot, not an export — a page that
loads fast, unfurls with an image in chat, and has a "make your own version"
button on it.

The remix loop is the growth mechanism: one person's list becomes three people's
lists. See [architecture/sharing.md](../architecture/sharing.md).

### 3. The feed — why anyone comes back

Follow people whose taste you like, see what they ranked. Likes and comments on
lists. A discovery surface by topic for people who follow nobody yet.

Deliberately unambitious: chronological, no algorithm.
See [architecture/social-feed.md](../architecture/social-feed.md).

## Principles

**Accounts stay optional for creating and sharing.** You can build a list and
publish a link with no account. Signing in adds ownership, a profile, and the
feed. This is a strengthening of [decisions.md D2](../decisions.md#d2), not a
retreat from it — a share flow gated behind sign-in kills the core loop.

**One shape everywhere.** A tier list is a `SaveFile`, identical in
`localStorage`, in an exported `.json`, and in the Convex document. Adding a
storage location must not require a new type.
See [decisions.md D4](../decisions.md#d4).

**No user image uploads.** Ever. The blocker is the image-moderation obligation
on a public, anonymously-publishable site, not the storage bill.
See [decisions.md D6](../decisions.md#d6). Custom items may reference an image
URL from an allowlisted host.

**Topics are data, not code.** Adding "board games" should be a registry entry,
not a branch in a component.
See [architecture/catalog-sources.md](../architecture/catalog-sources.md).

**The tool works before the network does.** Any feature that makes the editor
useless without a server is the wrong shape.

## Who it's for

| | Wants | Gets today | Needs |
| --- | --- | --- | --- |
| **The maker** | Build a specific list, well | Everything | Non-anime topics |
| **The sharer** | Send it to a group chat | PNG export | A link that unfurls |
| **The lurker** | See what people ranked | Nothing | Feed, discovery, profiles |
| **The remixer** | Disagree, publicly | Nothing | Remix button on a shared board |

Today the product serves exactly one of these four. That ordering is also the
build order: each row only makes sense once the row above it exists.

## What this is not

- **Not a review site.** No scores, no aggregate ratings, no "best anime of
  2024" authority. A tier list is one person's opinion, presented as such.
- **Not a social network.** No DMs, no follower-only content, no profile feeds
  competing with the home feed. The unit of content is a tier list; everything
  else is attached to one.
- **Not a catalog.** AniList and its equivalents own the metadata. The app
  hotlinks and denormalizes; it does not become a source of truth about anime.
- **Not an algorithm.** Chronological feed, explicit follows, explicit
  discovery. If ranking becomes necessary it will be because volume forced it,
  and that will be a documented decision.

## The naming problem

The repo is `anime-tier-list`, the package is `anime-tier-list`, the app calls
itself **Unicord** in `layout.tsx` metadata, and the GitHub org is
`unicord-table`. The storage key prefix is `atl:`.

That was four names for one product, and the anime-specific ones become
actively misleading the moment a games board exists.

**Settled** — the product is **Unicord**, matching the org. The user-facing
name is now one word everywhere: metadata, the header and footer lockups, the
`LICENSE` line. Still on the anime-specific names: the repo, the package, and
the `atl:` storage prefix. The first two are free to rename; `atl:` is inside
every saved board, so it costs a migration and is best folded into the
`schema: 2` backfill rather than paid for on its own.
