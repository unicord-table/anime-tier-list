# Share links

**Status: Built**, with named gaps. Share opens `PublishDialog`, `publish`
stores the board and mints a slug, and `/t/[slug]` renders it.

| Planned here | Shipped? |
| --- | --- |
| `tierlists` table, publish / update / get | Yes — `convex/tierlists.ts`, plus `remove` and `mine` |
| `/t/[slug]` server-rendered, one read, zero catalog calls | Yes |
| Remix | Yes — `RemixButton` in `components/board/BoardActions.tsx` |
| Payload / item / tier caps, text sanitisation, image allowlist | Yes — `src/lib/publish.ts`, enforced on both sides |
| `noindex` on `/t/[slug]` | Yes |
| Anonymous publish + edit tokens + claim | **No** — superseded by [D15](../decisions.md#d15) |
| Publishes per IP rate limit | **No** — see [Still missing](#still-missing) |
| Reports table | **No** — same |
| OpenGraph image | **No** — same |
| View counts | Not built, and that was one of the options |

This is the headline feature of the product: hand someone a URL and they see
your tier list. Everything else in the social layer depends on it existing.

## Still missing

Three of the "non-negotiable" abuse controls below did not ship. What changed
the calculus is [D15](../decisions.md#d15): publishing requires an account, so
the threat model is "a signed-in user misbehaves", not "the open internet can
write to your database". That lowers the urgency; it does not make them
unnecessary.

| Gap | Ship it when |
| --- | --- |
| Rate limiting | Before anonymous publishing returns, or at the first sign of one account writing in bulk. `@convex-dev/rate-limiter` — do not hand-roll a counter |
| `reports` table + report action | Before `/t/[slug]` is indexable, or the first time a takedown request has nowhere to land |
| OpenGraph image | Whenever link unfurls matter. Option (2) below is still the right starting point |

## Shape of the feature

```mermaid
flowchart LR
    editor["Editor /"] -->|"publish"| mut["tierlists.publish"]
    mut --> db[("tierlists")]
    db --> page["/t/[slug]<br/>server component"]
    page --> viewer(["Anyone with the link"])
    viewer -->|"Remix"| editor

    classDef store fill:#e8e8f5,stroke:#5d5294,color:#2b2741;
    class db store;
```

**Remix is not optional.** A read-only page is a dead end; "open this in the
editor as my own copy" is what turns one shared link into two boards. It costs
almost nothing — the published document *is* a `SaveFile`, so remix is
`store.replace(data)` plus a fresh local save. Build it in the same phase.

## URLs

| Route | Rendering | Purpose |
| --- | --- | --- |
| `/t/[slug]` | Server component | The shared board. One DB read, zero catalog API calls. **Built** |
| `/t/[slug]/opengraph-image` | Route segment | OG card. See [OpenGraph](#opengraph) below. **Not built** |
| `/tierlist` | Client, `ssr: false` | Editor. `?board=<slug>` opens a published board — as an edit if you own it, as a copy if you don't |
| `/tierlists` | Client | Your published boards, paginated |

`slug` is `nanoid(10)` — URL-safe, ~10^17 space, unguessable enough that an
unlisted board is genuinely unlisted. Do not use a title slug: titles collide,
change, and leak content into the URL.

> This is the first server-rendered route in the app, and it is the exact trigger
> condition recorded in [decisions.md D11](../decisions.md#d11) for moving from
> `@convex-dev/auth/react` to `@convex-dev/auth/nextjs`. Decide that **before**
> building `/t/[slug]`, not after — retrofitting means touching every auth
> consumer.
>
> **Decided: stay on `/react`.** `/t/[slug]` reads anonymously, so it renders
> nothing viewer-specific and needs no token on the server. The page's only
> owner-aware affordance would have been "edit this", and that lives on
> `/tierlists` instead, which is a client component. The trigger fires again the
> day a server-rendered route has to branch on the viewer.

Strictly, `/t/[slug]` only needs auth on the server once the page shows
viewer-specific state (your like, your follow button, "edit this" for the
owner). A first version that renders the board and hydrates interactivity
client-side avoids the migration. Pick deliberately; don't drift into it.

## Ownership: two models, both required ~~one model~~

> **Superseded by [D15](../decisions.md#d15).** Only the signed-in row shipped:
> `ownerId` is required and `tierlists.publish` throws for a signed-out caller.
> There is no `editTokenHash`, no `localStorage["atl:tokens"]`, and no `claim`.
> The original reasoning is kept below because reversing it is a live option —
> the schema change is additive.

| Publisher | Stored | Can edit by |
| --- | --- | --- |
| Signed out | `editTokenHash`, `ownerId: null` | Presenting the raw token from `localStorage["atl:tokens"]` |
| Signed in | `ownerId`, `editTokenHash: null` | Being that user |

Anonymous publishing has to keep working. It is how a first-time visitor shares
anything, and requiring sign-in to share would gate the product's core loop
behind an account — the opposite of [decisions.md D2](../decisions.md#d2)'s
"optional in the strong sense".

**Token handling.** Generate server-side on publish (`nanoid(32)`), return once,
store only `sha256(token)`. Losing the token means losing edit rights to that
link — acceptable, because the user still holds their local copy and can
republish. A signed-in user should be able to **claim** an anonymous list by
presenting the token, which sets `ownerId` and clears `editTokenHash`.

**What shipped instead.** Every write goes through `requireOwnedBoard` in
`convex/lib/auth.ts`, which derives the user from the request identity and
returns the same error for "no such board" and "not yours" — a distinguishable
pair would turn the id space into an existence oracle.

## Visibility

`public | unlisted | private`, on the document.

| Value | Reachable by link | In feed / browse | `noindex` |
| --- | --- | --- | --- |
| `public` | yes | yes | no |
| `unlisted` | yes | no | yes |
| `private` | owner only | no | yes |

Default new publishes to **`unlisted`**. Someone clicking "Share" is asking for
a link, not for an audience; opting into the feed should be a second, deliberate
action. It also means the first published boards can't fill an empty feed with
test data.

`private` requires `ownerId`, so it is unavailable to anonymous publishers.

## Abuse controls — non-negotiable for this phase

This is the phase where an anonymous user can write to your database. Every
control below ships with it, not after it.

| Control | Value | Why |
| --- | --- | --- |
| Payload cap | ~256 KB serialized | Nothing legitimate is bigger. Convex documents cap at 1 MB regardless |
| Item cap | ~500 items | Bounds render cost of the public page |
| Tier cap | ~26 tiers | Same |
| Publishes per IP | Rate-limited | Cheapest defence against a flood |
| Text sanitisation | Strip HTML from `title` and tier `label`; render as text | The only free text the user controls |
| Image URL allowlist | Only `imageHosts` from registered sources | Stops the board being used as a tracker or an image host |
| `noindex` on `/t/[slug]` | Until discovery is wanted | Keeps junk out of search results |
| Report button + `reports` table | From day one | You need somewhere for a takedown request to land before you need it |

The image allowlist is new relative to the original plan and it matters more
than it looks: without it, a published board is an arbitrary-URL renderer that
anyone can point at anything, which is both a tracking vector and someone else's
bandwidth bill.

**On the 1,200-title import.** The app already supports importing a whole
AniList profile. That will exceed the 500-item publish cap. Cap the publish, not
the import, and say so in the error: *"Published boards are capped at 500 items —
this board has 1,240."*

## Functions

```ts
// convex/tierlists.ts (Built)

publish({ title, description, visibility, data })  -> { id, slug }
update({ id, title, description, visibility, data? }) -> { slug }
remove({ id })                                     -> null

bySlug({ slug })          -> summary + data + isOwner, or null
mine({ paginationOpts })  -> paginated summaries; empty when signed out
feed({ query?, limit? })  -> public boards, newest first
```

`update` takes `data` optionally, so renaming a board does not reupload its
payload. `bySlug` returns `isOwner` — that one boolean is what lets the editor
choose between "update this board" and "open it as my own copy", and it is
always false on the anonymous server render.

`prepareBoard(data)` is the shared gate, used by `publish` and `update` and by
the dialog before it submits. It is `parseSaveFile`'s referential-integrity pass
plus the caps above. **The code is shared with the client** — `src/lib/` is
importable from `convex/` in this repo layout, and a validation rule that exists
in only one of the two places will drift.

`summarize()` builds every card payload, listing fields one at a time rather
than spreading the document. That is what keeps the `data` blob and the owner's
email out of a listing, and the `returns:` validator is what enforces it.

**View counts.** Incrementing a counter on every read makes every page view a
write, and turns one hot board into a write-contention hotspot. Options, cheapest
first: don't count views at all; count them in a periodic aggregate; or
increment a sharded counter. Do not put a naive `viewCount++` in the `get`
query — queries in Convex can't write anyway, so it would have to become a
mutation on every page load. **Open** — needs a decision before launch.

## OpenGraph

A shared link that unfurls as a blank card gets clicked much less. The board
needs an image.

Three options, in order of cost:

1. **Static card** — title, item count, topic, rendered as an OG image route
   from text only. Cheap, boring, works everywhere.
2. **Composite of the top tier's covers** — fetch the first ~5 `items` images
   and lay them out. Needs the images to be fetchable server-side (they are;
   they're public CDN URLs) and respects the same allowlist.
3. **Full board render** — a real screenshot. Expensive, needs a headless
   browser, out of scope.

Start at (2), fall back to (1) when a board has no images (a `custom`-source
board often won't). Generate on publish and store in Convex file storage rather
than rendering per request — the board only changes when it is updated.

## What the published page must not do

- **No catalog API calls.** Titles and image URLs are denormalized into the
  `SaveFile`'s `items` map precisely so the public page is one DB read. If you
  ever find yourself calling AniList from `/t/[slug]`, the data model has been
  broken.
- **No editor bundle.** The public page should not ship `@dnd-kit` or
  `html-to-image`. That is why the renderer is
  `components/board/ReadOnlyBoard.tsx`, extracted out of `PublicPreview` and now
  shared by both. It carries no `"use client"` directive, so it compiles as a
  server component on `/t/[slug]` and as a client one inside the editor's
  preview, where it also takes the `ref` the PNG export needs.

## Done when

A link opens correctly in a private window, on someone else's machine, with the
publisher signed out — and unfurls with an image in a chat app.
