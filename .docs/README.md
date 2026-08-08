# Docs

Documentation for the tier list project — what's built, what's planned, and why.

**Verified against code on 2026-08-08.** Every page carries a status label;
anything marked *Planned* is design, not fact. Rules for keeping this true are
in [contributing/doc-maintenance.md](contributing/doc-maintenance.md).

## The one-paragraph version

A Next.js 16 app whose **editor runs entirely in the browser** — the catalog
calls AniList directly (CORS is open, no key needed, rate limits are per-IP) and
the board autosaves to `localStorage`. A Convex deployment is attached for
optional Google/GitHub sign-in and currently gates nothing. Everything is one
JSON shape, `SaveFile`, which lives identically in `localStorage` and in an
exported `.json` — and will live identically in a Convex document when
publishing lands. The product is becoming a social platform for tier lists on
any topic: link sharing, profiles, and a chronological feed, in that order.

## Start here

| If you're… | Read |
| --- | --- |
| New to the codebase | [architecture/overview.md](architecture/overview.md) |
| Figuring out what to build next | [product/roadmap.md](product/roadmap.md) |
| Wondering "why is it done this way" | [decisions.md](decisions.md) |
| About to open a PR | [contributing/adding-a-feature.md](contributing/adding-a-feature.md) |

## Everything

### Product

| Doc | Contents |
| --- | --- |
| [product/vision.md](product/vision.md) | What the product is becoming, and what it deliberately isn't |
| [product/roadmap.md](product/roadmap.md) | Phases in dependency order, with what shipped and what's next |

### Architecture

| Doc | Contents |
| --- | --- |
| [architecture/overview.md](architecture/overview.md) | Stack, shape, the one route, where planned work attaches |
| [architecture/context.md](architecture/context.md) | C4 context + containers, trust boundaries |
| [architecture/components.md](architecture/components.md) | Layer spine, module map, dependency rules |
| [architecture/lifecycles.md](architecture/lifecycles.md) | First paint, search, drag, autosave, undo, sign-in — step by step |
| [architecture/data-model.md](architecture/data-model.md) | `SaveFile` today, its generalized v2, and the Convex schema |
| [architecture/auth.md](architecture/auth.md) | Convex Auth, OAuth setup, env vars, QA checklist, troubleshooting |
| [architecture/catalog-sources.md](architecture/catalog-sources.md) | **Planned** — pluggable sources, the seam for non-anime topics |
| [architecture/sharing.md](architecture/sharing.md) | **Planned** — `/t/[slug]`, ownership, abuse controls, OpenGraph |
| [architecture/social-feed.md](architecture/social-feed.md) | **Planned** — profiles, follows, likes, comments, the feed |
| [architecture/deployment.md](architecture/deployment.md) | Vercel + Convex, build command, secrets, gaps |

### Frontend

| Doc | Contents |
| --- | --- |
| [frontend/board-state.md](frontend/board-state.md) | `board.ts` contract, `useTierList`, undo, autosave |
| [frontend/drag-and-drop.md](frontend/drag-and-drop.md) | dnd-kit wiring and the collision detection that took three tries |
| [frontend/design-system.md](frontend/design-system.md) | Tokens, primitives, the `Text` rule, images |

### Reference

| Doc | Contents |
| --- | --- |
| [reference/external-apis.md](reference/external-apis.md) | AniList / Jikan / MAL / Drive contracts, verified against live APIs |
| [reference/licensing.md](reference/licensing.md) | MIT, dependency licences, third-party data |

### Decisions and process

| Doc | Contents |
| --- | --- |
| [decisions.md](decisions.md) | D1–D14. Why it's built this way and what was deliberately skipped |
| [contributing/adding-a-feature.md](contributing/adding-a-feature.md) | Where things go, by layer |
| [contributing/doc-maintenance.md](contributing/doc-maintenance.md) | How these docs stay true |
| [contributing/adr-template.md](contributing/adr-template.md) | Template and calibration for new decision entries |

## Ground rules

1. **Accounts are optional for creating and sharing.** The board lives in
   `localStorage` and the app runs with no Convex deployment configured at all.
   Publishing will return an edit token, not a login wall.
   ([D2](decisions.md#d2), [D12](decisions.md#d12))
2. **No user image uploads.** Ever. Not a perf decision — it means there is no
   image moderation surface. ([D6](decisions.md#d6))
3. **One shape.** Add a field to `SaveFile`, not to a second "just the DB"
   shape. Breaking changes bump `schema` and ship a migration in the same PR.
   ([D4](decisions.md#d4))
4. **Verify API claims.** Everything in
   [reference/external-apis.md](reference/external-apis.md) was checked against
   the live API on the recorded date. Re-check before relying on it.
5. **Docs are part of the change.** See
   [contributing/doc-maintenance.md](contributing/doc-maintenance.md).

## Known corrections to earlier docs

The previous doc set was written before the code and drifted. Corrected here:

| Was claimed | Actually |
| --- | --- |
| Postgres `tierlists` table for share links | Convex — [D13](decisions.md#d13) |
| Google Drive sync as Phase 3 | Superseded by server-side lists — [D13](decisions.md#d13) |
| "Comments / likes / feeds: never, probably" | The product — [D12](decisions.md#d12) |
| "Manga / games / movies: it's a `type:` change" | The item model is anime-shaped — [D14](decisions.md#d14) |
| Tier row reordering deliberately skipped | Shipped in commit `11405ee` |
| Search results cached in an in-memory `Map` | Never built; only a 350ms debounce and request abortion |
| `next.config.ts` needs `images.remotePatterns` | Not needed; the app uses plain `<img>`, never `next/image` |
| `atl:tokens` localStorage key | Planned, does not exist |
