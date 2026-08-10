# System context and containers

C4 levels 1 and 2. Level 3 (components) is [components.md](components.md).

## Level 1 — Context (Built)

Today there is one user type and no server-held state.

```mermaid
flowchart TB
    user(["Creator<br/>builds a tier list"])
    app["Unicord<br/>Next.js app, browser-resident"]
    anilist["AniList<br/>GraphQL API + CDN"]
    oauth["Google / GitHub<br/>OAuth providers"]
    convex["Convex<br/>auth backend"]

    user -->|"builds, exports"| app
    app -->|"search, trending, list import, detail"| anilist
    app -->|"sign in — optional"| convex
    convex -->|"OAuth handshake"| oauth
```

## Level 1 — Context (Planned)

The social platform adds a second actor who never touches the editor, and makes
the backend load-bearing.

```mermaid
flowchart TB
    creator(["Creator"])
    viewer(["Viewer<br/>arrives via a shared link"])
    app["Unicord"]
    convex["Convex<br/>data + auth + feed"]
    sources["Catalog sources<br/>AniList, and others"]
    oauth["OAuth providers"]

    creator -->|"builds, publishes, follows"| app
    viewer -->|"opens /t/slug, likes, comments"| app
    app -->|"read + write"| convex
    app -->|"search, browse"| sources
    convex -->|"server-side sources needing API keys"| sources
    convex --> oauth
```

The new edge worth noticing is **Convex → catalog sources**. Some sources
(games, film, music) require an API key that cannot ship to a browser, so they
must run in a Convex action. AniList must keep running in the browser for the
rate-limit reason in [decisions.md D3](../decisions.md#d3). The source interface
therefore has to support both — that constraint drives
[catalog-sources.md](catalog-sources.md).

## Level 2 — Containers (Built)

```mermaid
flowchart TB
    subgraph client["Browser"]
        next["Next.js app<br/>one route, ssr:false editor"]
        store[("localStorage<br/>key: atl:save")]
    end

    subgraph vercel["Vercel"]
        static["Static assets + RSC payload<br/>next build output"]
    end

    subgraph convexdep["Convex deployment"]
        httpapi["HTTP router<br/>convex/http.ts<br/>/api/auth/signin, /callback/*, JWKS"]
        queries["Query functions<br/>convex/users.ts viewer"]
        db[("Document DB<br/>authTables only")]
    end

    anilistapi["graphql.anilist.co"]
    anilistcdn["s4.anilist.co"]

    next -->|"initial load"| static
    next <-->|"read/write board"| store
    next -->|"fetch POST"| anilistapi
    next -->|"img src"| anilistcdn
    next -->|"websocket, ConvexReactClient"| queries
    next -->|"browser redirect"| httpapi
    queries --> db
    httpapi --> db

    classDef store fill:#e8e8f5,stroke:#5d5294,color:#2b2741;
    class store,db store;
```

### Container notes

**Next.js app.** Deployed on Vercel (inferred from `@vercel/analytics` in
`src/app/layout.tsx` and the `vercel/install-vercel-web-analytics` merge in git
history). No `vercel.json` is checked in, so the deployment uses framework
defaults. Marked **inferred** — confirm before relying on it.

**localStorage.** One key, `atl:save`, holding a `SaveFile`. Defined as
`SAVE_KEY` in `src/lib/storage.ts`.

> **Discrepancy.** [data-model.md](data-model.md) previously documented a second
> key, `atl:tokens`, for share-link edit tokens. No such key exists in code —
> it belongs to unbuilt Phase 2 work and is now marked Planned.

**Convex deployment.** `convex/http.ts` mounts only what `auth.addHttpRoutes`
provides. `convex/schema.ts` spreads `authTables` and adds nothing. The only
application function in the deployment is the `viewer` query.

**Optionality.** `src/components/ConvexClientProvider.tsx` reads
`process.env.NEXT_PUBLIC_CONVEX_URL` and exports `convex` as `null` when it is
unset, rendering children without a provider. Every consumer of Convex hooks
must null-check `convex` first, because the hooks throw with no provider above
them. This is what makes a clone-and-run with no Convex account work.

## Level 2 — Containers (Planned)

```mermaid
flowchart TB
    subgraph client["Browser"]
        editor["Editor route /"]
        public["Public board /t/slug"]
        feed["Feed / profile routes"]
    end

    subgraph convexdep["Convex deployment"]
        q["Queries<br/>boards, feed, profile"]
        m["Mutations<br/>publish, like, follow, comment"]
        a["Actions<br/>keyed catalog sources, OG image"]
        db[("Document DB<br/>tierlists, profiles, follows,<br/>likes, comments, feedEvents")]
        files[("Convex file storage<br/>OG cards")]
    end

    editor --> m
    editor --> q
    public --> q
    feed --> q
    feed --> m
    q --> db
    m --> db
    a --> db
    a --> files

    classDef store fill:#e8e8f5,stroke:#5d5294,color:#2b2741;
    class db,files store;
```

`/t/[slug]` is the one route that should be server-rendered, for OpenGraph tags
and for viewers who arrive without JavaScript warm. That requirement is exactly
the trigger condition recorded in [decisions.md D11](../decisions.md#d11) for
switching from `@convex-dev/auth/react` to `/nextjs` — plan for it before
building sharing, not after.

## Trust boundaries

| Boundary | Crossed by | Enforcement today |
| --- | --- | --- |
| Untrusted JSON → app | Uploaded `.json`, `localStorage` contents | `parseSaveFile` in `src/lib/storage.ts` — throws with a readable reason, drops keys with no `media` record |
| App → AniList | `fetch` from `src/lib/anilist.ts` | No key, no credentials; errors surfaced through `AniListError` |
| Browser → Convex | Websocket + OAuth redirect | Convex Auth JWT; `convex/auth.config.ts` trusts `CONVEX_SITE_URL` |
| **Planned:** client → published board | Publish/update mutations | Not built. Payload caps, rate limits, and text sanitisation are specified in [sharing.md](sharing.md) and are non-negotiable for that phase. |
