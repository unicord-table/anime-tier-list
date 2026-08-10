# Decisions

Why things are the way they are, and what was deliberately left out. If you're
about to add something, check whether it's already listed under "skipped" with a
trigger condition.

**How to use this file.** Entries are append-only and numbered. A decision that
changes is marked **Superseded by Dn** and keeps its original text — the
reasoning trail is the point. Adding one: copy
[contributing/adr-template.md](contributing/adr-template.md), take the next
number, link it from wherever it's relevant.

| # | Decision | Status |
| --- | --- | --- |
| [D1](#d1) | AniList over Jikan | Active |
| [D2](#d2) | Optional accounts, OAuth only | Active (superseded the original "no accounts") |
| [D3](#d3) | Browser-direct AniList calls, no proxy | Active |
| [D4](#d4) | One JSON shape everywhere | Active — **storage target changed to Convex, see [D13](#d13)** |
| [D5](#d5) | `@dnd-kit` over native HTML5 DnD | Active |
| [D6](#d6) | No user image uploads | Active |
| [D7](#d7) | `drive.appdata` scope | **Superseded by [D13](#d13)** — Drive sync is no longer the plan |
| [D8](#d8) | Editor mounted `ssr: false` | Active |
| [D9](#d9) | Hand-written validation, not zod | Active — trigger is close, see [D13](#d13) |
| [D10](#d10) | Deferred items with triggers | Active, partially stale — corrections inline |
| [D11](#d11) | Convex Auth `/react`, not `/nextjs` | Active — trigger fires in the sharing phase |
| [D12](#d12) | The product is a social platform | Active — supersedes "feeds: never" |
| [D13](#d13) | Convex as the application database | Active — supersedes the Postgres plan and [D7](#d7) |
| [D14](#d14) | Generalize the item model before building social | **Not followed — see [D16](#d16)** |
| [D15](#d15) | Publishing requires an account | Active — supersedes anonymous publish + edit tokens |
| [D16](#d16) | Share links shipped on `schema: 1` | Active — accepts a server-side backfill D14 wanted to avoid |

---

## D1 — AniList is the primary data source, not Jikan

**Decision:** search and list-import both go to AniList GraphQL. Jikan is a
fallback, used only if something needs MAL-specific data.

The original assumption was Jikan, since "MyAnimeList" was the stated reference
point. Testing both live on 2026-08-01 reversed it:

| | AniList | Jikan |
| --- | --- | --- |
| Availability in testing | 200 on every call | Intermittent 504s across endpoints |
| Rate limit | 30/min, **headers exposed to the browser** | 3/sec, 60/min, not exposed |
| User list import | 1 request, no auth, custom lists included | Unreliable in testing |
| Over-fetching | GraphQL — request exactly the 8 fields needed | Fixed large JSON per anime |
| MAL ids | Returns `idMal` on every result | Native |

The `idMal` field is what makes this a clean call rather than a compromise: MAL
compatibility is retained for free, so nothing is actually given up by not
calling MAL's ecosystem directly.

---

## D2 — Optional accounts, OAuth only ~~No accounts~~

**Superseded 2026-08-08.** The original call was no accounts at all: publishing
returns an edit token stored in localStorage, and Phase 3's Drive sync solves
"edit from a second device" as a side effect.

What actually changed the answer is that the objection was never to *accounts*,
it was to what accounts used to cost: password storage, email verification, and
account recovery. Convex Auth with Google and GitHub has none of those — there is
no password to store, no email to verify, and recovery is the provider's problem.
The remaining cost is a sessions table, which the library owns.

So: sign-in exists, and it is **optional in the strong sense**. The app runs with
`NEXT_PUBLIC_CONVEX_URL` unset — no account UI, no Convex client, editor
unchanged. Nothing in Phase 1 got a login wall.

Still deliberately absent: email/password, magic links, and anonymous accounts.
Each is one line in `convex/auth.ts`, and each brings back a piece of what was
being avoided. Setup is in [architecture/auth.md](architecture/auth.md).

---

## D3 — Search calls AniList from the browser, not through a server proxy

This one is worth understanding before "improving" it.

AniList's rate limit is **per IP**. Calling from the browser means each user gets
their own 30/min budget — the app scales to any number of users with zero server
capacity. Routing the same calls through a Next.js route handler would put every
user behind the *server's* single IP, capping the entire app at 30 requests per
minute globally.

A proxy is the intuitive "proper" architecture here and it is strictly worse at
low scale, so: no proxy. There's no API key to hide, and CORS is open.

**Add a proxy when** *both* of these are true: you want a shared cache across
users (search queries repeat heavily — "frieren" a thousand times is one upstream
call), **and** you've added caching good enough that the shared 30/min ceiling
isn't a regression. Cache first, proxy second, never proxy first.

The public `/t/[id]` page never needed a proxy regardless — its data is
denormalized into the save file.

---

## D4 — One JSON shape everywhere

> **Still active, but the storage target changed.** "Postgres `data` column" and
> "Drive file" below are superseded by [D13](#d13) — it is now a Convex
> document. The principle is unchanged and is the reason the swap costs nothing.

`SaveFile` is byte-identical in localStorage, in the export file, in the
Postgres `data` column, and in the Drive file.

The alternative — a normalized relational schema — would mean a `tierlists`
table, a `tiers` table, an `items` table, a `media` cache table, joins to render
one board, and a serializer to produce an export. That's four tables and a
translation layer for data that is only ever read and written as one whole unit.

Consequence accepted: you can't query "how many lists put Frieren in S tier"
without scanning JSONB. If that becomes a real feature, add a Postgres GIN index
on `data`, or a derived table populated on write. Don't restructure the app for
a stat nobody asked for.

---

## D5 — @dnd-kit instead of native HTML5 drag-and-drop

The default instinct is to use the platform: HTML5 `draggable` ships with the
browser and costs zero dependencies.

Overridden here because native DnD does not fire on touch devices at all, and
gives no keyboard path. Tier lists get built and shared on phones constantly, and
"unusable on mobile, unusable with a keyboard" isn't a simplification — it's a
missing feature. Making native DnD work on touch means hand-writing pointer-event
fallbacks, which is more code than the dependency.

`@dnd-kit` gives pointer, touch, and keyboard sensors plus screen-reader
announcements out of the box.

Three settings that matter, all in `BoardEditor`:

- `PointerSensor` uses `activationConstraint: { distance: 6 }`, so a plain click
  stays a click. Without it, tapping a cover would start a drag instead of
  opening the detail modal.
- `KeyboardSensor` is rebound to **Space** only (`keyboardCodes.start`). Its
  default also claims Enter, which would collide with Enter-to-open-details.
- Collision detection is `pointerWithin` with a `rectIntersection` fallback,
  **not** `closestCorners` or `closestCenter`. Distance-based detection scores
  the dragged rect against every droppable, and a tier row is a wide rect while
  a cover tile is a small one — so a tile rows away regularly beat the row the
  cursor was inside, and only the topmost tier ever accepted a drop.
  `pointerWithin` returns only what is under the pointer, nearest centre first:
  the tile when there is one (which is what supplies the slot index), the row
  otherwise. Keyboard drags have no pointer, hence the fallback.

---

## D6 — No user image uploads, ever

Cover art is hotlinked from AniList's CDN.

Uploads would add object storage, a bill, and — the actual blocker — an image
moderation obligation on a public, anonymously-publishable site. That's a
category of risk this project has no reason to take on.

**Reconsider when:** never. If custom covers are genuinely wanted, allow pasting
a URL from an allowlisted domain instead.

---

## D7 — `drive.appdata`, not broader Drive scopes ~~(Phase 3)~~

> **Superseded by [D13](#d13).** Drive sync existed to solve "edit from a second
> device" without a server. There is now a server. The scope research below is
> still correct and worth keeping if Drive ever returns.

`drive.appdata` and `drive.file` are both non-sensitive; `drive.readonly` and
full `drive` are restricted and require security review.

Using `appdata` means the app writes to a hidden folder it alone can see, can't
read the user's real files, and clears Google's review with basic verification
only. A broader scope would cost weeks of process to gain access the app has no
use for.

---

## D8 — The editor is mounted with `ssr: false`

`TierListShell` loads `TierListApp` through `next/dynamic` with `ssr: false`.

The board's initial state comes from `localStorage` and its data from `fetch`.
Server-rendering it produces markup the client contradicts on the first paint, so
the usual workaround is to render an empty shell and hydrate inside a
`useEffect`. React 19's `react-hooks/set-state-in-effect` rule correctly flags
that as a cascading render — and it *is* one.

Skipping SSR for this route removes the problem rather than working around it:
`useTierList` reads storage straight from a `useState` initialiser, there is no
`hydrated` flag, and `save` is never null. There is nothing on this page worth
server-rendering anyway.

The same rule shaped two other spots — `CatalogPanel` and `AnimeDetailModal` both
store results *keyed by the query or id that produced them*, so "still loading"
is derived (`data?.term !== term`) instead of a second state field reset from an
effect.

---

## D9 — Hand-written save-file validation, not zod

`parseSaveFile` checks types by hand. It is one shape, and its most important
check is referential integrity — every key in `tiers`/`pool` must resolve in
`media` — which needs a custom refinement in zod regardless.

Unresolvable keys are dropped rather than rendering an undefined card, and a
corrupt localStorage entry is discarded with a console warning instead of
white-screening the app.

**Add zod when:** a second or third shape needs validating — Phase 2's request
bodies would be the moment.

---

## D10 — Deferred, with triggers

| Skipped | Add when |
| --- | --- |
| Server-side search proxy | Shared cache is wanted *and* built — see [D3](#d3). Note: a keyed source that *cannot* run in the browser is a different case and is allowed — see [catalog-sources.md](architecture/catalog-sources.md) |
| ~~User accounts~~ | **Built** 2026-08-08 — see [D2](#d2) |
| Normalized DB schema | A real cross-list query feature exists — see [D4](#d4) |
| MAL OAuth write-back | Someone wants the app to modify their real MAL list |
| Real sync conflict merging | Multi-user editing exists; last-write-wins is right for one user |
| ~~Manga / movies / games~~ | **Now in scope** — see [D12](#d12) and [D14](#d14). It is more than a `type:` change: the item model is anime-shaped |
| ~~Public list discovery page~~ | **Now in scope** — see [D12](#d12). The moderation floor is specified in [social-feed.md](architecture/social-feed.md#moderation) |
| Undo for text edits | Typing a title floods the stack; only structural changes are recorded. Coalesce per field if anyone asks |
| ~~Reordering tier rows~~ | **Built** — commit `11405ee`. `board.reorderTiers` + tier-vs-tier drag. This row was stale |
| Jikan calls of any kind | AniList returns `idMal` on every result, so MAL cross-referencing is already free — see [D1](#d1) |
| Email/password, magic links, anonymous accounts | Someone can't use Google or GitHub — see [D2](#d2) |
| Search result caching | Never built despite being described in the README. There is only a 350ms debounce and request abortion. Add it before considering a proxy — see [D3](#d3) |

---

## D11 — Convex Auth's React client, not its Next.js integration

`@convex-dev/auth` ships two client integrations. The Next.js one (`/nextjs`)
stores tokens in cookies and needs `convexAuthNextjsMiddleware`, so the server
can read auth state during SSR. The React one (`/react`) stores them in
localStorage and needs nothing else.

The React one, because **no page here is server-rendered with auth state**. The
editor is mounted `ssr: false` ([D8](#d8)) and the header is a client component.
Middleware would add a request-time hop to every route to produce a value nothing
reads.

Consequences accepted:

- Tokens are in localStorage, not httpOnly cookies. Worth stating plainly: this
  trades XSS resistance for not running a server. There are no server-rendered
  secrets, and a session grants nothing beyond a name and an avatar today — so
  the trade is cheap now, and gets re-examined the moment a mutation can destroy
  someone's data.
- A signed-in user's first paint has no account UI — `viewer` resolves over the
  websocket. Fine for a header chip; not fine if a *route* ever needs gating,
  which is the trigger below.

**Switch to `/nextjs` when:** a server component or route handler needs to know
who the caller is — a private `/t/[id]`, or server-rendered per-user boards.

**That trigger fires in the sharing phase.** `/t/[slug]` is a server component
and will show viewer-specific state. Decide before building it, not during —
see [sharing.md](architecture/sharing.md#urls).

---

## D12 — The product is a social platform for tier lists, not an anime tier list

**Decided 2026-08-08. Supersedes** the previous "Comments / likes / feeds —
never, probably; that's a different product" and "Manga / games / movies — the
whole app is source-agnostic already".

The scope is now: tier lists on any topic, shareable by link, with profiles, a
chronological newsfeed, likes, and comments. Rationale is in
[product/vision.md](product/vision.md).

Two things this costs that the old scope did not:

1. **The app is source-agnostic in principle but not in practice.** `Media`
   carries `idMal`, `titleEn` (romaji vs english), and `format` as TV/OVA/ONA.
   Those are anime concepts on the persisted type, so "it's a `type:` change in
   the query" was wrong. See [D14](#d14).
2. **A public feed is a moderation obligation.** The old scope had no
   user-visible surface where one stranger's content reached another. It now
   does, and the floor — reports table, soft-delete, rate limits, `noindex` by
   default, image-URL allowlist — ships with the feature rather than after it.
   [D6](#d6)'s no-uploads rule becomes load-bearing rather than merely
   convenient.

**Not reconsidered:** [D3](#d3) (browser-direct AniList), [D4](#d4) (one JSON
shape), [D6](#d6) (no uploads), [D8](#d8) (`ssr: false` editor). All four
survive the scope change intact, which is a reasonable signal they were right.

---

## D13 — Convex is the application database, not Postgres

**Decided 2026-08-08. Supersedes** the Postgres `tierlists` table specced in the
old data-model doc, and [D7](#d7)'s Google Drive sync.

Convex was added for auth (commit `e154bb7`) with the boards still in
localStorage. Now that boards need a server home, the question is whether to add
Postgres alongside it or use what's already there.

Convex, for three reasons in descending order of weight:

| | Why it decides this |
| --- | --- |
| **Reactive queries** | The feed, like counts, and comment threads all want to update without polling or cache invalidation. Convex queries are subscriptions by default. Building that on Postgres means adding a realtime layer — the single largest piece of work the alternative implies |
| **One backend, one auth context** | `getAuthUserId(ctx)` already works in every Convex function. Postgres would need its own authorization path fed from Convex-issued JWTs — two systems to keep in agreement about who a user is |
| **Documents fit the data** | [D4](#d4) says a tier list is stored and read as one whole unit. That is a document, and Convex stores documents natively; in Postgres it is a `jsonb` column in a table that exists to hold it |

Consequences accepted:

- **Vendor coupling.** The data lives in Convex's format and the functions are
  written against its API. Migrating out means an export plus a rewrite of every
  function. Mitigated only by [D4](#d4): the payload is portable JSON even if the
  surrounding code is not.
- **1 MB document cap.** A `SaveFile` from a 1,200-title AniList import may not
  fit. This constrains the publish cap rather than the schema — see
  [data-model.md](architecture/data-model.md#document-size).
- **No ad-hoc SQL.** Every access path needs an index defined up front, and
  analytics-shaped questions ("which title appears in S tier most often") are
  awkward. Already accepted under [D4](#d4); Convex makes it slightly sharper.
- **Explicit indexes.** A missing index is a full scan, not a slow query. They
  are enumerated in
  [data-model.md](architecture/data-model.md#indexes-to-define-up-front).

**Drive sync drops out entirely.** It existed to sync a board across devices
without a server. With owned server-side lists it serves only users who refuse
an account, and [D2](#d2) already made accounts cheap. The `drive.appdata` scope
research in [D7](#d7) stays on file.

**Reconsider when:** a genuine cross-list analytics feature exists (then add a
derived store, don't move the primary), or Convex's pricing at real volume makes
the read load untenable.

---

## D14 — Generalize the item model before building anything social

**Decided 2026-08-08.**

`SaveFile` v1 is anime-shaped: `media`, `cover`, `idMal`, `format` as TV/OVA,
`id: number`. Generalizing it to `items` / `image` / `externalIds` /
`meta.kind` / `sourceId: string` is a breaking change requiring `schema: 2` and
a migration.

Do it **first**, before share links and before the feed. The reason is
asymmetric cost:

- Migrating boards in `localStorage` and in exported `.json` files is a pure
  client-side function that runs on load. Users never notice.
- Migrating boards **already published on the server** means a backfill across
  every stored document, coordinated with a client rollout, with links live the
  whole time.

The second is many times the work and carries real risk of breaking someone's
shared link. Since generalization is going to happen either way, the only
question is which side of publishing it lands on.

**Consequence accepted:** the next thing shipped is invisible to users. A
rename-and-migrate release adds no feature. That is the correct trade against
migrating live published data later.

Migration table and the `custom` source that proves the abstraction:
[catalog-sources.md](architecture/catalog-sources.md).

---

## D15 — Publishing requires an account

**Decided 2026-08-10.** Supersedes the anonymous-publish + `editTokenHash` model
specced in [sharing.md](architecture/sharing.md#ownership-two-models-both-required).

A published board has exactly one owner model: `ownerId` pointing at a `users`
row. `tierlists.publish` throws for a signed-out caller.

The original argument for anonymous publishing was that requiring sign-in gates
the product's core loop behind an account, against [D2](#d2). What changed the
answer is that the loop being gated is *publishing*, not *building*: the editor
still needs no account, still autosaves, still exports a PNG and a `.json`.
Sign-in buys the thing the shipped feature is actually about — a board you can
come back to, edit, and delete from `/tierlists`.

What it costs, stated plainly:

- **A first-time visitor cannot share without signing in.** That is a real
  funnel step, and it is the reason to revisit this.
- The `claim` flow (a signed-in user adopting an anonymous board by presenting
  its token) does not exist, because there are no anonymous boards to claim.

Two things fall out of it that are worth having on their own:

- No `sha256(editToken)` handling, no `localStorage["atl:tokens"]`, no token
  loss path.
- Every write authorizes through `requireOwnedBoard` in `convex/lib/auth.ts`,
  one code path, and the abuse surface for anonymous writes is closed rather
  than defended.

**Reconsider when** someone actually bounces off the sign-in step — or when
share-per-visit matters more than owning what you shared. The schema change is
additive (`ownerId` becomes optional, `editTokenHash` appears beside it), so
this is not a one-way door.

---

## D16 — Share links shipped on `schema: 1`, before the item-model rename

**Decided 2026-08-10. This does not follow [D14](#d14),** and the reason D14
gave is now a cost that has to be paid rather than avoided.

D14's argument was asymmetric cost: migrating boards in `localStorage` is a pure
client-side function nobody notices, while migrating boards **already published
on the server** means a backfill across stored documents with live links the
whole time. Publishing shipped first, so the second is now the situation.

What makes it survivable, and what it obliges:

- Stored boards carry `schema: 1` explicitly and the payload is the same
  portable JSON as a `.json` export ([D4](#d4)). `v1ToV2` is therefore one pure
  function applied in two places rather than two migrations.
- The backfill is a single pass over `tierlists.data` with
  `@convex-dev/migrations`, and `tierlists.bySlug` can run `migrate()` on read
  during the rollout so no link breaks mid-deploy.
- **`prepareBoard` is the choke point.** Every write goes through it, so the
  migration only has to handle documents written before the change — there is
  no second ingest path to keep in step.

**Obligation this creates:** Phase 2 is no longer invisible-to-users work that
can ship whenever. It now needs a migration rehearsal against a snapshot before
it touches production. Budget for that, and do not add a second published shape
in the meantime.
