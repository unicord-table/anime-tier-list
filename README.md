# Tierist — anime tier list

Build, save, and share anime tier lists. Search the AniList catalog or import a
public list by username, drag titles into tiers, click any cover for details, and
export a save file or a PNG.

**Status:** the editor works end to end and still runs entirely client-side, with
no account needed to build a board. Publishing works too: sign in, and a board
gets a permanent link and a home on the feed. Profiles, follows, likes and
comments are designed but not built — see
[`.docs/product/roadmap.md`](.docs/product/roadmap.md).

**Where this is going:** a social platform for tier lists on any topic —
shareable by link, with profiles and a feed. See
[`.docs/product/vision.md`](.docs/product/vision.md).

## What works today

- **Search** AniList by title — no API key, no login, called straight from the browser
- **Trending** fills the catalog before you type anything
- **Import** a public AniList/MyAnimeList profile in one request (tested at 1,200+ titles)
- **Drag** titles between tiers and the unranked pool, reorder within a row
- **Click any cover** for a modal with synopsis, score, studio, genres, and links out to AniList and MyAnimeList
- **Tiers** — rename, recolour from the preset palette, add, delete (deleted tiers return their titles to the pool)
- **Undo / redo** for structural changes
- **Autosave** to localStorage, plus export/import of a `.json` save file
- **Export PNG** of the whole board
- **Preview** what the public page will look like
- **Sign in** with Google or GitHub — optional; publishing is the one thing that needs it
- **Publish** a board with a title and description, and get a permanent link
- **Share** it public (in the feed), unlisted (link only), or private (just you)
- **Remix** anyone's published board into your own editor
- **Manage** everything you've published at `/tierlists` — copy link, edit, delete

| Route | What |
| --- | --- |
| `/` | The feed — recently published public boards |
| `/tierlist` | The editor. `?board=<slug>` opens a published one |
| `/tierlists` | Your published boards |
| `/t/<slug>` | A published board, read-only |

## Getting started

```bash
npm install
```

```bash
npm run dev
```

`npm run dev` starts Next **and** `convex dev` together, so whichever deployment
`.env.local` points at gets the functions in `convex/` pushed to it before you
use them. Switching deployments needs no extra step.

Without a Convex deployment configured, run `npm run dev:next` on its own: the
editor works unchanged, the account UI hides itself, and the feed renders its
empty state — see [`.docs/architecture/auth.md`](.docs/architecture/auth.md).

| Command | What it does |
| --- | --- |
| `npm run dev` | Next on http://localhost:3000 + `convex dev` watching `convex/` |
| `npm run dev:next` | Next only — for working without a backend |
| `npm run build` | Production build. Does **not** deploy Convex; Vercel's build command does |
| `npm test` | Everything below |
| `npm run test:lib` | Board, feed and publish logic (Node's runner, no framework) |
| `npm run test:convex` | Convex functions against an in-memory database (`convex-test` + vitest) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · dnd-kit ·
Phosphor icons · Convex + Convex Auth for optional sign-in. The board itself
still has no backend and no database — it lives in localStorage.

## Layout

```
convex/           auth providers, schema, the `viewer` query (see .docs/architecture/auth.md)
src/
  app/            route + Nocturne design tokens (globals.css)
  components/
    auth/         AccountMenu — sign-in modal, avatar, sign-out
    ui/           Text, Button, IconButton, TextInput, Segmented,
                  Modal, Tag, Toast, ExternalLink
    anime/        AnimeCard, AnimeDetailModal
    catalog/      CatalogPanel (search + import)
    board/        AppHeader, ToolRail, TierRow, TierColorPicker,
                  UnrankedPool, BoardEditor, PublicPreview
    dnd/          dnd-kit wiring, kept out of the presentational components
  lib/
    types.ts        SaveFile and friends — the one persisted shape
    board.ts        pure board operations (+ board.test.ts)
    anilist.ts      GraphQL client: search, trending, list import, detail
    storage.ts      localStorage, validation, .json export/import
    useTierList.ts  board state + undo/redo + autosave
```

Every piece of text renders through
[`components/ui/Text.tsx`](src/components/ui/Text.tsx) — change a size or tone
there, not in a component.

## Docs

Full index: [`.docs/README.md`](.docs/README.md).

| Doc | What's in it |
| --- | --- |
| [`.docs/architecture/overview.md`](.docs/architecture/overview.md) | Start here — stack, shape, module map |
| [`.docs/product/roadmap.md`](.docs/product/roadmap.md) | Phases, what ships when |
| [`.docs/product/vision.md`](.docs/product/vision.md) | What the product is becoming |
| [`.docs/architecture/data-model.md`](.docs/architecture/data-model.md) | Save file schema, its generalized v2, planned Convex schema |
| [`.docs/reference/external-apis.md`](.docs/reference/external-apis.md) | AniList / Jikan / MAL contracts, verified against the live APIs |
| [`.docs/decisions.md`](.docs/decisions.md) | Why it's built this way, and what was deliberately skipped |
| [`.docs/architecture/auth.md`](.docs/architecture/auth.md) | Convex + OAuth setup, env vars, and the sign-in QA checklist |
| [`.docs/contributing/adding-a-feature.md`](.docs/contributing/adding-a-feature.md) | Where things go, by layer |
