# Adding a feature

A walkthrough of where things go, using real code paths. Follow the layer that
matches your change; most features touch two or three.

## Before you write anything

1. Check [decisions.md](../decisions.md) — the thing you're about to add may be
   listed under "skipped" with a trigger condition. If the trigger has fired,
   say so in the PR.
2. Check [product/roadmap.md](../product/roadmap.md) for ordering. Some work is
   deliberately blocked on [D14](../decisions.md#d14) (generalize the item model
   before anything social).
3. If the change alters *why* the system is built a certain way, it needs a
   decision entry — see [adr-template.md](adr-template.md).

## A new board operation

Example: "duplicate a tier".

```
src/lib/board.ts        pure function
src/lib/board.test.ts   a case
src/lib/useTierList.ts  expose it in the actions memo
src/components/...      call it
```

1. **`board.ts`** — `(save, ...args) => SaveFile`. Never mutate. Return `save`
   itself on a no-op. Call `touch()` on a real change.
2. **`board.test.ts`** — cover the happy path *and* the no-op, because `commit`
   short-circuits on `next === save` and a wrongly-fresh copy silently pollutes
   the undo stack.
3. **`useTierList`** — add to the `actions` memo. Choose `history` honestly:
   structural change → default; text edit → `{ history: false }`.
4. **Component** — call `store.thing()`. No board logic in the component.

**Do not add a runtime import to `board.ts`.** Types only — that is what lets
`node --test` run against it with no bundler. Details in
[frontend/board-state.md](../frontend/board-state.md).

## A new UI component

```
src/components/ui/          if it's a primitive reused across features
src/components/<area>/      if it belongs to one feature
```

- Text renders through `ui/Text.tsx`. Missing variant → add the variant.
- Colours come from tokens in `globals.css`. No hex literals.
- Presentational components take props; they don't fetch and don't read storage.
- If it needs drag behaviour, wire it in `components/dnd/DragParts.tsx`, not in
  the component — see [frontend/drag-and-drop.md](../frontend/drag-and-drop.md).

## A new catalog source

Blocked on the source registry ([roadmap Phase 3](../product/roadmap.md)). Once
it exists:

```
src/lib/sources/<id>.ts     implements CatalogSource
src/lib/sources/registry.ts register it
.docs/reference/external-apis.md  document the contract you verified
```

Decide `runsOn` honestly. `"browser"` only if the API needs no secret, sends
open CORS, and rate-limits per IP. Anything else is `"server"` and goes through
a Convex action. Pick a **short, permanent** key prefix — it is written into
saved data. Full rules:
[architecture/catalog-sources.md](../architecture/catalog-sources.md).

## A new Convex function

```
convex/<domain>.ts          query / mutation / action
convex/schema.ts            table + indexes if new
convex/lib/auth.ts          requireUser / requireOwner (planned)
```

- **Queries may return `null` for signed-out. Mutations must throw.** That
  asymmetry is stated in `convex/users.ts` and is the whole authorization model.
- **Never take a user id from arguments** — a client can send any string. It
  comes from `getAuthUserId(ctx)`.
- **Define the index** in `schema.ts` for every access path. A missing index is
  a full scan.
- **Validate arguments.** Convex validators for shape; the shared
  referential-integrity pass for `SaveFile` payloads. Share that code with the
  client rather than writing it twice.

## A change to the persisted shape

The highest-risk change in this repo. Every saved board is in the old shape.

- **Additive optional field** → no `schema` bump. Add it to the type, handle
  `undefined` everywhere, done.
- **Rename, removal, or type change** → bump `schema`, and ship the migration in
  the same PR. Keep the old parser permanently.

The migration runs on **every** load — `localStorage`, uploaded `.json`, and
later the server. Test it against a real pre-change save file, not a synthetic
one. See [architecture/data-model.md](../architecture/data-model.md#migration).

## A new route

There is exactly one route today (`src/app/page.tsx`, `ssr: false`). Adding a
server-rendered route is not a neutral act:

- It is the trigger for the `@convex-dev/auth` `/react` → `/nextjs` question
  ([D11](../decisions.md#d11)) if it needs to know who the caller is.
- `layout.tsx` sets `overflow-hidden` on `<body>` for the editor's app-shell
  layout. A scrolling route needs that moved into a route group.
- Don't ship the editor bundle (`@dnd-kit`, `html-to-image`) to a read-only page.

## Before you open a PR

```bash
npm run typecheck && npm run lint && npm test
```

There is no CI running these — see
[architecture/deployment.md](../architecture/deployment.md#gaps-to-close). Until
there is, it's the honour system.

Then check the docs. If your change touched any of the following, update the
matching page in the same PR:

| Changed | Update |
| --- | --- |
| `src/lib/types.ts` | [architecture/data-model.md](../architecture/data-model.md) |
| `src/lib/board.ts` or `useTierList.ts` | [frontend/board-state.md](../frontend/board-state.md) |
| dnd-kit config | [frontend/drag-and-drop.md](../frontend/drag-and-drop.md) |
| `convex/` | [architecture/components.md](../architecture/components.md), [auth.md](../architecture/auth.md) |
| tokens or `ui/` | [frontend/design-system.md](../frontend/design-system.md) |
| an external API contract | [reference/external-apis.md](../reference/external-apis.md) |
| *why* something is built a certain way | [decisions.md](../decisions.md) |

Rules for keeping this set honest are in
[doc-maintenance.md](doc-maintenance.md).
