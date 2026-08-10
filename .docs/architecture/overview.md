# Architecture overview

> **Status legend used across these docs**
> **Built** — verified against code on 2026-08-08.
> **Planned** — designed here, no code yet. Do not cite as fact.
> **Open** — no decision made. Needs an entry in [decisions.md](../decisions.md).

## What this is

A Next.js 16 App Router application whose editor runs **entirely in the
browser**, with a Convex deployment attached for authentication only. There is
currently no server that stores a tier list — the board lives in `localStorage`.

The product direction (see [product/vision.md](../product/vision.md)) is a
social platform for tier lists on any topic, with link-based sharing, profiles,
and a newsfeed. That work has not started. This document describes what exists
and marks the seams where the planned work attaches.

## Stack — Built

| Layer | Choice | Where |
| --- | --- | --- |
| Framework | Next.js `16.2.12`, App Router | `src/app/` |
| UI | React `19.2.4`, TypeScript strict | `src/components/` |
| Styling | Tailwind v4 via `@tailwindcss/postcss`, tokens as CSS custom properties | `src/app/globals.css` |
| Icons | `@phosphor-icons/react`, tree-shaken by `optimizePackageImports` | `next.config.ts` |
| Drag & drop | `@dnd-kit/core` + `/sortable` + `/modifiers` | `src/components/dnd/`, `src/components/board/BoardEditor.tsx` |
| Backend | Convex `^1.43.0` | `convex/` |
| Auth | `@convex-dev/auth` `^0.0.94` + `@auth/core` (Google, GitHub) | `convex/auth.ts` |
| Raster export | `html-to-image` (dynamic import) | `src/components/TierListApp.tsx` |
| IDs | `nanoid` | `src/lib/useTierList.ts` |
| Analytics | `@vercel/analytics` | `src/app/layout.tsx` |
| Tests | Node's built-in `node --test`, no framework | `src/lib/board.test.ts` |

There is no state-management library, no data-fetching library, no form library,
and no validation library. Board state is one hook; validation is hand-written
(see [decisions.md D9](../decisions.md#d9)).

## Shape

```mermaid
flowchart TB
    subgraph browser["Browser — where the app actually runs"]
        editor["Editor<br/>TierListApp"]
        state["Board state<br/>useTierList + board.ts"]
        ls[("localStorage<br/>atl:save")]
        catalog["Catalog<br/>anilist.ts"]
    end

    subgraph external["External"]
        anilist["AniList GraphQL<br/>graphql.anilist.co"]
        cdn["AniList CDN<br/>s4.anilist.co"]
    end

    subgraph convex["Convex deployment — optional"]
        auth["Convex Auth<br/>convex/auth.ts"]
        viewer["viewer query<br/>convex/users.ts"]
        authdb[("authTables")]
    end

    editor --> state
    state <--> ls
    editor --> catalog
    catalog -->|"POST GraphQL"| anilist
    editor -->|"hotlinked img"| cdn
    editor -->|"websocket"| viewer
    viewer --> authdb
    auth --> authdb

    classDef store fill:#e8e8f5,stroke:#5d5294,color:#2b2741;
    class ls,authdb store;
```

Two things about this diagram are the whole architecture:

1. **The board never crosses the network.** No request the app makes carries a
   tier list. Losing the Convex deployment loses sign-in and nothing else.
2. **The catalog talks to AniList directly, not through a server.** This is a
   deliberate call about rate limits, not an oversight — see
   [decisions.md D3](../decisions.md#d3).

## The routes

| Route | File | Rendering | Data |
| --- | --- | --- | --- |
| `/` | `src/app/page.tsx` | Server component | `tierlists.feed`, read anonymously |
| `/t/[slug]` | `src/app/t/[slug]/page.tsx` | Server component | `tierlists.bySlug`, one read |
| `/tierlists` | `src/app/tierlists/page.tsx` | Shell + client `MyBoards` | `tierlists.mine`, paginated |
| `/tierlist` | `src/app/tierlist/page.tsx` | `TierListShell`, `ssr: false` | localStorage |
| `/changelog` | `src/app/changelog/page.tsx` | Server component | `src/lib/changelog.ts`, static |

The editor is still mounted with `ssr: false` — reasoning in
[decisions.md D8](../decisions.md#d8). There are no route handlers and no
middleware.

**The editor used to be `/`.** It moved when the landing page took the root, and
nothing redirects, because nothing 404s: `/` still resolves, now to the feed.
Published boards live under `/t/`, a separate namespace, so a permalink is
unaffected by anything that happens to the app routes.

### Server reads without the auth migration

The two server-rendered routes read Convex through `src/lib/convex-server.ts`,
which attaches **no auth token**. That is what keeps
[D11](../decisions.md#d11)'s `@convex-dev/auth/react` choice intact: nothing
server-rendered depends on who is asking. Anything viewer-specific — the
listing page, the publish dialog, the "is this mine" check — is a client
component with the session in the browser.

The same module absorbs two failure modes on purpose: `NEXT_PUBLIC_CONVEX_URL`
may be unset (a clone with no backend still renders), and a backend hiccup
returns null rather than 500ing the landing page.

`/` keeps its search term in the query string (`?q=`) rather than in client
state, so the feed is linkable and crawlable and costs no JavaScript. The query
runs against the `tierlists` title search index.

The editor route serves two views, toggled by React state (`BoardView` in
`src/components/board/AppHeader.tsx`), not by navigation:

- `editor` — the working board
- `preview` — `PublicPreview`, a local rehearsal of what a published page will
  look like. It renders from the same in-memory `SaveFile`; nothing is published.

## Where the planned work attaches

| Planned capability | Attachment point in today's code |
| --- | --- |
| Share links | `TierListApp.onShare` currently shows a toast. Needs a Convex mutation + a `/t/[slug]` route. See [sharing.md](sharing.md). |
| Non-anime topics | `src/lib/anilist.ts` is imported directly by `CatalogPanel`. Needs a source registry behind an interface. See [catalog-sources.md](catalog-sources.md). |
| Newsfeed, profiles, follows | Nothing exists. Convex schema is auth-only today. See [social-feed.md](social-feed.md). |
| Server-side rendering of a board | Blocked by the `/react` auth client choice. See [decisions.md D11](../decisions.md#d11). |

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Next dev server on `http://localhost:3000` |
| `npm run build` | Production build |
| `npm test` | `node --test "src/**/*.test.ts"` — board logic only |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (`eslint-config-next` core-web-vitals + typescript) |
| `npx convex dev` | Convex backend watching `convex/`; only needed for sign-in |

`tsconfig.json` excludes `**/*.test.ts` from the build and maps `@/*` →
`./src/*` and `@convex/*` → `./convex/*`.

## Read next

- [context.md](context.md) — system context and containers
- [components.md](components.md) — module map and dependency rules
- [lifecycles.md](lifecycles.md) — what happens on a search, a drag, a load
- [data-model.md](data-model.md) — `SaveFile`, and the Convex schema it becomes
