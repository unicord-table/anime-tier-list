# Decisions

Why things are the way they are, and what was deliberately left out. If you're
about to add something, check whether it's already listed under "skipped" with a
trigger condition.

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
being avoided. Setup is in [06-auth.md](06-auth.md).

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

## D7 — `drive.appdata`, not broader Drive scopes

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
| Server-side search proxy | Shared cache is wanted *and* built — see [D3](#d3) |
| User accounts | Drive sync proves insufficient — see [D2](#d2) |
| Normalized DB schema | A real cross-list query feature exists — see [D4](#d4) |
| MAL OAuth write-back | Someone wants the app to modify their real MAL list |
| Real sync conflict merging | Multi-user editing exists; last-write-wins is right for one user |
| Manga / movies / games | Trivial — it's a `type:` change in the query |
| Public list discovery page | You want the traffic *and* have moderation for it |
| Undo for text edits | Typing a title floods the stack; only structural changes are recorded. Coalesce per field if anyone asks |
| Reordering tier rows | You set S/A/B/C/D/F once and rename in place. Nobody has needed to drag a whole row yet |
| Jikan calls of any kind | AniList returns `idMal` on every result, so MAL cross-referencing is already free — see [D1](#d1) |
| Email/password, magic links, anonymous accounts | Someone can't use Google or GitHub — see [D2](#d2) |

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
