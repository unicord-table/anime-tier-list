# Roadmap

Each phase ships something usable on its own. Nothing in a later phase requires
rewriting an earlier one — that's the whole point of the shared `SaveFile` shape
in [02-data-model.md](02-data-model.md).

---

## Phase 0 — Scaffold

```bash
npx create-next-app@latest . --ts --tailwind --app --eslint --src-dir --use-npm
npm i @dnd-kit/core @dnd-kit/sortable html-to-image nanoid
```

`next.config.ts` must allow AniList's CDN or `next/image` will refuse cover art:

```ts
images: { remotePatterns: [{ protocol: "https", hostname: "s4.anilist.co" }] }
```

**Done when:** blank page deploys to Vercel.

---

## Phase 1 — The editor (no server, no DB) ✅ shipped

This is the whole product for a single user. Do not start Phase 2 before this is
genuinely pleasant to use.

Three things came out differently from the plan once built:

- The catalog shows **trending** titles when the search box is empty, so the grid
  is never blank on first load.
- The catalog is a drag *source* only, not a drop target. Results now come from
  the API rather than local state, so "drag a title back into the results" no
  longer means anything. Removing a title happens in its detail modal instead.
- The tool rail's last slot is **Load save file**, not the design's Settings
  gear — loading a `.json` is a real feature and the gear did nothing.

- Tier rows (default S/A/B/C/D/F) with editable labels and colors
- An unranked pool below the rows
- Drag between any row and the pool, reorder within a row (`@dnd-kit/sortable`)
- Add/remove/reorder tier rows
- Search box → AniList, **called directly from the browser**, 300ms debounce,
  results cached in an in-memory `Map` keyed by query
- "Import from AniList/MAL username" → dumps a user's list into the pool
- Autosave to `localStorage` on every change (debounced ~400ms)
- Export / import `.json` save file
- Export PNG (`html-to-image` → `toPng` on the board element)
- Click any cover for a detail modal — synopsis, score, studio, genres, and
  outbound links to AniList and MyAnimeList

**Skipped on purpose:** any server route. AniList's rate limit is per-IP, so
browser-direct calls scale for free — see [04-decisions.md](04-decisions.md#d3).

**Done when:** you can build a list, close the tab, reopen it, and it's still
there; and you can hand someone the `.json` and they can load it. ✅

---

## Phase 2 — Share links

The first phase that needs a server. One table, three routes.

- `POST /api/tierlists` → `{ id, editToken }`, token stored in localStorage
- `PATCH /api/tierlists/[id]` → requires the token, updates in place
- `/t/[id]` → server-rendered read-only board

The published page needs **zero** API calls: titles and cover URLs are already
denormalized into the save file's `media` map.

Abuse controls — these are the non-negotiable part of this phase:

| Control | Why |
| --- | --- |
| Payload cap (~256 KB) | Nothing legitimate is bigger |
| Rate limit publishes per IP | Cheapest way to stop a flood |
| Cap tiers (~26) and items (~500) | Bounds render cost on the public page |
| Strip HTML from title/labels; render as text | Only free-text the user controls |
| `noindex` on `/t/[id]` until you want discovery | Keeps junk out of search results |

**Done when:** a link opens correctly in a private window on someone else's
machine.

---

## Phase 3 — Google Drive sync

`drive.appdata` is a **non-sensitive** scope, so this needs only basic OAuth
verification, not the sensitive-scope review. Confirmed 2026-08-01 — see
[03-apis.md](03-apis.md#google-drive).

- Google Sign-In → token with scope `.../auth/drive.appdata`
- Write `tierlists.json` into the hidden app-data folder
- On load: compare `updatedAt` local vs remote, newest wins, prompt if both
  changed since last sync
- Drive stays **optional**. localStorage remains the source of truth for a user
  who never signs in.

**Skipped on purpose:** real conflict merging. Last-write-wins with a prompt is
correct for single-user-multi-device, which is the only case here.

---

## Phase 4 — Write back to MyAnimeList (optional, probably never)

Only worth building if you want the app to *modify* someone's real MAL list.
Requires MAL OAuth2 + a client secret, which is safe now that a server exists.
Reading a public list already works with no auth in Phase 1, so this earns its
keep only for writes.

Ship Phases 1–3 first and see whether anyone asks.

---

## Deliberately not in scope

| Not building | Reconsider when |
| --- | --- |
| User accounts | Someone needs their lists on a new device without Drive |
| Comments / likes / feeds | Never, probably — that's a different product |
| Custom image uploads | Never. Adds storage + moderation for near-zero gain |
| Manga / games / movies | The whole app is source-agnostic already; it's a query change |
| Realtime collaborative editing | Two people actually ask for it |
