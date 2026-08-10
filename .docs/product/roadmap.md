# Roadmap

Each phase ships something usable on its own. Nothing in a later phase should
require rewriting an earlier one — that is what the shared `SaveFile` shape in
[data-model.md](../architecture/data-model.md) buys.

Phases are ordered by dependency, not by date. There are no dates.

---

## Phase 0 — Scaffold ✅ shipped

Next.js 16 App Router, TypeScript, Tailwind v4, dnd-kit, deployed.

> The original Phase 0 required `images.remotePatterns` for `s4.anilist.co` in
> `next.config.ts`. It was never needed — the app uses plain `<img>`, not
> `next/image`. See [frontend/design-system.md](../frontend/design-system.md#images).

---

## Phase 1 — The editor ✅ shipped

The whole product for a single user, entirely client-side.

- Tier rows (S/A/B/C/D/F default) with editable labels and colours
- Unranked pool; drag between any row and the pool; reorder within a row
- Add / remove / **reorder** tier rows
- AniList search from the browser, 350ms debounce, in-flight requests aborted
- Trending fills the catalog before you type
- Import a public AniList/MAL profile in one request (tested at 1,200+ titles)
- Detail modal per cover — synopsis, score, studio, genres, outbound links
- Undo / redo for structural changes
- Autosave to `localStorage` (400ms debounce), export/import `.json`
- Export PNG of the whole board
- Preview of what the public page will look like

Three things came out differently from the original design:

- The catalog shows **trending** when the box is empty, so the grid is never
  blank on first load.
- The catalog is a drag **source only**, not a drop target — results come from
  the API, so "drag a title back into the results" means nothing. Removal
  happens in the detail modal.
- The tool rail's last slot is **Load save file**, not a settings gear.

> Two roadmap corrections. **Tier reordering shipped** (commit `11405ee`) despite
> being listed as deliberately skipped. And the search **result cache** described
> as an in-memory `Map` was never built — there is only the debounce and request
> abortion.

---

## Phase 1.5 — Sign-in ✅ shipped

Optional Google/GitHub sign-in via Convex Auth (commit `e154bb7`). Gates
nothing. The app runs with `NEXT_PUBLIC_CONVEX_URL` unset.
See [architecture/auth.md](../architecture/auth.md) and
[decisions.md D2](../decisions.md#d2).

---

## Phase 1.6 — Landing page ✅ shipped

The editor moved from `/` to `/tierlist`, and `/` became a newsfeed-style
landing page: hero and CTA, a chronological feed, announcements, quick links,
footer. Server-rendered, with the search term in the query string.

> Shipped first with labelled sample posts, then rewired onto real published
> boards in Phase 4 below. There is no sample content in the app now.

Two things from the design were deliberately dropped and stay dropped: like and
save buttons (they need a `likes` table and a signed-in mutation — a toggle that
only sets local state would misrepresent the product) and a "most ranked this
week" card (aggregate tiers are on the never list below). The featured strip
went too: featuring needs someone to do the featuring.

---

## Phase 4 — Share links ✅ shipped (out of order)

**Shipped before Phase 2**, which is the one thing
[D14](../decisions.md#d14) said not to do. The consequence is recorded as
[D16](../decisions.md#d16): published documents now have to be backfilled when
`schema: 2` lands, instead of the migration being a pure client-side function.

- `tierlists` table; `publish` / `update` / `remove` / `bySlug` / `mine` / `feed`
- `/t/[slug]` server-rendered, one read, zero catalog API calls
- **Remix** — open a shared board as your own copy
- `/tierlists`, the owner's paginated listing, with copy-link / edit / delete
- Publish dialog in the editor: title, description, visibility
- Caps, text sanitisation and the image allowlist, shared by client and server

Not built, with triggers in
[sharing.md](../architecture/sharing.md#still-missing): OpenGraph images, a
`reports` table, per-account rate limiting. Anonymous publish was dropped
outright — [D15](../decisions.md#d15).

**Done when** a link opens in a private window on someone else's machine, with
the publisher signed out. It does. It does not yet unfurl with an image.

---

## Phase 2 — Generalize the item model ⬜ next

**Ship this before anything social.** It is a breaking change to the persisted
shape, and every board published in a later phase would otherwise need migrating
in place on the server.

> **That "otherwise" already happened.** Phase 4 shipped first, so there are
> published documents. This phase now also needs a `@convex-dev/migrations`
> backfill over `tierlists.data`, rehearsed against a snapshot before it touches
> production, with `migrate()` running on read during the rollout so no link
> breaks mid-deploy. See [D16](../decisions.md#d16).

1. `schema: 1` → `schema: 2`. `Media` → `Item`, `media` → `items`,
   `cover` → `image`, `format` → `meta.kind`, `idMal` → `externalIds.mal`,
   `id: number` → `sourceId: string`. Add `topic`.
2. `migrate()` runs on every load — `localStorage`, uploaded file, later server.
3. `createEmptySave` switches tier ids from `t1`–`t6` to `nanoid(6)`.

**Done when:** an existing `atl:save` from before the change loads with no
visible difference, and a `.json` exported last month still imports.

**Risk:** this is the only step that can destroy someone's saved board. Ship it
alone, with tests on `v1ToV2`, and keep the v1 parser permanently.

---

## Phase 3 — Catalog source registry ⬜

Extract `CatalogSource` from `lib/anilist.ts`; add `lib/sources/registry.ts`.
Behaviour identical, one source. Then add the **`custom`** source — user-defined
items, no API, no key — which is the first moment a non-anime board is possible.

See [architecture/catalog-sources.md](../architecture/catalog-sources.md).

**Done when:** you can build "rank my friends" with no external API involved.

---

## Phase 4 — Share links

Shipped ahead of Phases 2 and 3 — written up above, next to Phase 1.6, since
that is where it lands in time. The `@convex-dev/auth` `/react` → `/nextjs`
question it was supposed to force was answered by not needing it: the
server-rendered routes read anonymously ([D11](../decisions.md#d11)).

---

## Phase 5 — Profiles and identity ⬜

`profiles` table, handle chosen at first publish, `/u/[handle]` listing someone's
public boards.

> `/tierlists` already answers "here's everything **I've** ranked" for the
> signed-in user. What is missing is the public, addressable version of it, and
> a handle to hang it on — right now a board's author is a display name with no
> page behind it. The claim-an-anonymous-list flow is gone with
> [D15](../decisions.md#d15).

**Done when:** "here's everything I've ranked" is one URL someone else can open.

---

## Phase 6 — The social layer ⬜

Follows, likes, comments — in that order, each shipping on its own. Then the
home feed: chronological, read-time assembly, live via Convex reactivity.

Discovery (topic browse, trending) ships **with** the feed, not after — a new
user's home feed is empty, so discovery is the default tab.

Moderation floor ships with comments: reports table, soft-delete, rate limits.

See [architecture/social-feed.md](../architecture/social-feed.md).

---

## Phase 7 — More sources ⬜

The first `runsOn: "server"` source (games or film), proving the Convex action
wrapper and server-side API keys. Only worth doing once `custom` has shown which
topics people actually build.

---

## Later, maybe

| | Reconsider when |
| --- | --- |
| Google Drive sync | Was Phase 3 of the old plan. Largely obsoleted by owned server-side lists — it only serves users who refuse an account. Revisit if that group turns out to matter |
| MAL OAuth write-back | Someone wants the app to modify their real MAL list |
| Notifications | `feedEvents` exists for another reason |
| Fan-out-on-write feed | Feed p95 > ~300ms, or >50 sub-queries per page |
| Algorithmic ranking | Chronological visibly fails |
| Realtime collaborative editing | Two people actually ask |
| Light theme | Someone asks. Tokens already make it a one-file change |

## Deliberately not building

| Never | Why |
| --- | --- |
| User image uploads | Image-moderation obligation on a public anonymous site — [D6](../decisions.md#d6) |
| Direct messages | Different product, much larger risk surface |
| Server-proxied AniList search | Caps the whole app at 30 req/min globally — [D3](../decisions.md#d3) |
| Aggregate scores / "official" rankings | A tier list is one person's opinion. Aggregating it makes it a review site |
