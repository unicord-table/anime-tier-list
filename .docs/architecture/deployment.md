# Deployment

## Today

```mermaid
flowchart TB
    dev(["Developer"])
    gh["GitHub<br/>unicord-table/anime-tier-list"]
    vercel["Vercel<br/>Next.js build + edge/CDN"]
    convexprod["Convex production deployment"]
    browser(["Browser"])
    anilist["AniList API + CDN"]
    oauth["Google / GitHub OAuth"]

    dev -->|"push / PR"| gh
    gh -->|"build hook"| vercel
    vercel -->|"npx convex deploy --cmd 'npm run build'"| convexprod
    browser -->|"HTML, JS, RSC"| vercel
    browser -->|"websocket + OAuth redirect"| convexprod
    browser -->|"GraphQL + images"| anilist
    convexprod --> oauth
```

**Inferred, not verified.** There is no `vercel.json`, no CI workflow, and no
Dockerfile in the repo. Vercel hosting is inferred from `@vercel/analytics` in
`src/app/layout.tsx` and from the `vercel/install-vercel-web-analytics` branch in
git history. The Convex production deployment is inferred from
`CONVEX_DEPLOYMENT` in `.env.local`. Confirm both in the Vercel and Convex
dashboards before treating this page as fact, and correct it here when you do.

## Build

| Setting | Value |
| --- | --- |
| Build command | `npx convex deploy --cmd 'npm run build'` (see [auth.md](auth.md#production)) |
| Output | Next.js default (`.next`) |
| Node | Next 16 requires Node 20.9+ |
| Install | `npm ci` from `package-lock.json` |

`npx convex deploy --cmd` is doing three things in order: push `convex/` to the
production deployment, inject the resulting `NEXT_PUBLIC_CONVEX_URL` into the
build environment, then run the build. Using a plain `npm run build` instead
produces a bundle with no Convex URL — which fails open (no account UI) rather
than failing loudly, so the mistake is easy to miss.

## Environments

| Environment | Next.js | Convex | OAuth apps |
| --- | --- | --- | --- |
| Local | `npm run dev` | `npx convex dev` | Dev OAuth apps, `SITE_URL=http://localhost:3000` |
| Preview | Vercel preview deploy | **Open** — see below | — |
| Production | Vercel production | `npx convex deploy` | Production OAuth apps, `SITE_URL` = real origin |

> **Open question: preview deployments.** Vercel gives every PR a unique URL.
> Convex Auth pins `SITE_URL` per deployment and GitHub allows one callback URL
> per OAuth app, so sign-in cannot work on a per-PR preview URL without either a
> Convex preview deployment per branch or a wildcard-tolerant setup. Until
> that's decided, **expect sign-in to be broken on previews** and test auth
> locally or in production. Not a blocker while auth gates nothing; it becomes
> one when it does.

## Secrets

Two separate stores, and putting a secret in the wrong one is the most common
setup failure:

| Store | Contains | Set with |
| --- | --- | --- |
| Vercel project env | `NEXT_PUBLIC_*` only | Vercel dashboard |
| Convex deployment env | `AUTH_GOOGLE_*`, `AUTH_GITHUB_*`, `JWT_PRIVATE_KEY`, `JWKS`, `SITE_URL` | `npx convex env set [--prod]` |

Nothing secret is ever a `NEXT_PUBLIC_*` variable — those are inlined into the
client bundle at build time.

`.env.local` is gitignored and holds `CONVEX_DEPLOYMENT`,
`NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CONVEX_SITE_URL`. There is no
`.env.example` in the repo.

> **Gap.** Add a `.env.example` listing the three keys with placeholder values.
> A contributor currently has to read `ConvexClientProvider` to discover what
> `.env.local` should contain.

## What has no server-side cost today

The editor. It is static output plus browser-direct API calls, so a spike in
users costs Vercel bandwidth and nothing else — AniList's per-IP rate limit is
absorbed by the users themselves ([decisions.md D3](../decisions.md#d3)).

That changes with [sharing.md](sharing.md). Published boards are Convex reads and
writes, and a viral link is a real read load against one document. Convex's
function-call and bandwidth pricing become the cost model at that point. Worth
knowing before the first popular board, not after.

## Planned: what deployment gains

| Addition | Impact |
| --- | --- |
| `/t/[slug]` server component | First route with a server render on the request path; first time Vercel function cold starts matter |
| OG image generation | Generate on publish and store in Convex file storage, not per request |
| Convex actions for keyed sources | Server-side API keys; a new class of secret in the Convex env |
| Rate limiting | Needs a store. Convex table + index is the obvious first answer |

## Gaps to close

- **No CI.** `npm run typecheck && npm run lint && npm test` is documented in
  `CONTRIBUTING.md` as a manual pre-PR step. A GitHub Actions workflow running
  the same three commands on every PR is ~20 lines and removes the honour system.
- **No `.env.example`.** See above.
- **No deployment documented as verified.** See the top of this page.
- **No rollback note.** Vercel rolls back instantly; Convex schema changes do
  not. Once `tierlists` exists, a schema change that drops a field is not
  reversible by redeploying the previous build — write the rollback plan into
  the PR that changes a schema.
