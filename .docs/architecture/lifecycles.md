# Lifecycles

What actually happens, step by step, for the flows that matter. All **Built**
unless marked otherwise.

## First paint

```mermaid
sequenceDiagram
    participant B as Browser
    participant L as app/layout.tsx
    participant S as TierListShell
    participant A as TierListApp
    participant H as useTierList
    participant LS as localStorage

    B->>L: GET /
    L->>L: Inter font, ConvexClientProvider, Analytics
    Note over L: convex is null when<br/>NEXT_PUBLIC_CONVEX_URL is unset —<br/>children render without a provider
    L->>S: render page.tsx -> TierListShell
    S-->>B: "Loading your board…" (dynamic ssr:false)
    B->>A: hydrate + import ./TierListApp
    A->>H: useTierList()
    H->>LS: getItem("atl:save")
    LS-->>H: JSON or null
    H->>H: parseSaveFile, or createEmptySave()
    H-->>A: save
    A-->>B: editor renders with real state on first paint
```

The `useState` initialiser reads `localStorage` synchronously. That is only safe
because `ssr: false` guarantees the hook never runs on the server — there is no
server markup for the client to contradict, so no `hydrated` flag and no
set-state-in-effect cascade. See [decisions.md D8](../decisions.md#d8).

If `parseSaveFile` throws, `loadSave` logs `"Discarding unreadable save file"`
and returns `null`, and the user gets a fresh board rather than a white screen.

## Catalog search

```mermaid
sequenceDiagram
    participant U as User
    participant C as CatalogPanel
    participant D as useDebounced (350ms)
    participant AL as lib/anilist.ts
    participant API as graphql.anilist.co

    U->>C: types "frier"
    C->>D: query
    D-->>C: term (after 350ms idle)
    C->>C: new AbortController
    alt term is empty
        C->>AL: fetchTrending(signal)
    else term present
        C->>AL: searchAnime(term, signal)
    end
    AL->>API: POST { query, variables }
    API-->>AL: { data } or { errors }
    AL-->>C: Media[]
    C->>C: setData({ term, list })
    Note over C: loading is derived:<br/>data?.term !== term
    U->>C: types again
    C->>C: cleanup aborts the in-flight request
```

Three details that are load-bearing:

- **Results are stored keyed by the term that produced them.** `loading` is
  derived (`data?.term !== term`), not a second state field reset from an
  effect. The same pattern is used in `AnimeDetailModal`, keyed by id.
- **The effect returns `controller.abort()`.** A superseded request is cancelled,
  and the `.catch` early-returns when `controller.signal.aborted`, so a cancelled
  request never clears good results.
- **Errors surface as messages, not statuses.** AniList answers "Private User"
  with an `errors` array on a 404 body, so `gql` checks `json.errors` *before*
  `res.ok`. A 429 is special-cased and reads `Retry-After`.

> The root README mentions an in-memory `Map` cache keyed by query. **No such
> cache exists in `CatalogPanel` or `anilist.ts` today** — only the 350ms
> debounce and request abortion. Treat that line as stale.

## Dragging a card

```mermaid
sequenceDiagram
    participant U as User
    participant DC as DndContext
    participant CD as collisionDetection
    participant BE as BoardEditor
    participant ST as useTierList
    participant BL as lib/board.ts

    U->>DC: pointer down + 6px move
    DC->>BE: onDragStart(active)
    BE->>BE: setDragging(media) — feeds DragOverlay
    U->>DC: pointer move
    DC->>CD: droppableContainers, active
    CD->>CD: split candidates: tier-vs-tier, tile-vs-tile
    CD->>CD: pointerWithin, else rectIntersection
    CD-->>DC: nearest droppable
    U->>DC: pointer up
    DC->>BE: onDragEnd(active, over)
    BE->>BE: resolveTarget(over) -> { region, index }
    alt dragged from catalog
        BE->>ST: addMedia(media, region, index)
        ST->>BL: board.addMedia
    else already on the board
        BE->>ST: moveItem(key, region, index)
        ST->>BL: board.moveItem
    end
    BL-->>ST: new SaveFile
    ST->>ST: push previous onto past[], clear future[]
```

The collision-detection strategy is the single most surprising piece of code in
the repo and it is there for a reason — full explanation in
[frontend/drag-and-drop.md](../frontend/drag-and-drop.md) and
[decisions.md D5](../decisions.md#d5).

## Autosave

```mermaid
flowchart LR
    change["any commit()"] --> setstate["setSave(next)"]
    setstate --> effect["useEffect [save]"]
    effect --> timer["setTimeout 400ms"]
    timer --> persist["persistSave"]
    persist --> ls[("localStorage atl:save")]
    setstate -.->|"new save before 400ms"| clear["clearTimeout — restart"]

    classDef store fill:#e8e8f5,stroke:#5d5294,color:#2b2741;
    class ls store;
```

`AUTOSAVE_MS = 400` in `src/lib/useTierList.ts`. `persistSave` swallows quota
and private-mode failures with a `console.warn` rather than throwing — losing an
autosave should not take the editor down with it.

> **Gap.** A failed `persistSave` is invisible to the user; only the console
> knows. If autosave becomes the difference between keeping and losing work,
> route that warning into `useToast`.

## Undo / redo

`commit(fn, { history })` in `useTierList`:

- `history: true` (default) pushes the pre-change `SaveFile` onto `past`,
  capped at `HISTORY_LIMIT = 50`, and clears `future`.
- `history: false` is used by `setTitle` and `renameTier`, because a keystroke
  should not fill the undo stack.
- If `fn` returns the identical object (`next === save`), nothing is committed.
  This is why every no-op path in `board.ts` returns `save` unchanged rather
  than a fresh copy — `moveItem` with an unknown key, `removeTier` with an
  unknown id, `reorderTiers` with `from === to`, `addManyToPool` with nothing
  new. Preserve that when adding operations.

## Load a save file

```mermaid
sequenceDiagram
    participant U as User
    participant TA as TierListApp
    participant IN as hidden file input
    participant SG as storage.readSaveFile
    participant ST as useTierList

    U->>TA: clicks Load save file (ToolRail)
    TA->>IN: fileInput.current.click()
    U->>IN: picks a .json
    IN->>TA: onChange
    TA->>SG: readSaveFile(file)
    SG->>SG: file.text -> JSON.parse -> parseSaveFile
    alt valid
        SG-->>TA: SaveFile
        TA->>ST: store.replace(save)
        TA->>U: toast "Save file loaded"
    else invalid
        SG-->>TA: throws with a reason
        TA->>U: error toast with that reason
    end
    TA->>IN: e.target.value = "" so the same file re-fires
```

`parseSaveFile` drops any key in `tiers`/`pool` that has no matching `media`
record rather than rendering an undefined card. That referential-integrity pass
is the reason validation is hand-written — see
[decisions.md D9](../decisions.md#d9).

## Export PNG

`html-to-image` is imported dynamically inside `exportPng`, so the rasteriser is
not in the initial bundle. `toPng` runs against `boardRef`, which
`BoardEditor` attaches to the **inner** wrapper rather than the scroll
container — otherwise the export would capture only the scrolled-into-view
slice. `pixelRatio: 2`, `backgroundColor: "#161826"` (the `--color-canvas`
token, hardcoded here; keep the two in sync).

## Sign-in

```mermaid
sequenceDiagram
    participant U as User
    participant AM as AccountMenu
    participant CA as ConvexAuthProvider
    participant CH as convex/http.ts
    participant P as Google / GitHub
    participant DB as authTables

    U->>AM: Sign in with Google
    AM->>CA: signIn("google")
    CA->>CH: /api/auth/signin/google
    CH->>P: OAuth authorize
    P-->>CH: /api/auth/callback/google
    CH->>DB: upsert user + authAccount, issue JWT
    CH-->>CA: token -> localStorage
    CA->>CH: websocket with JWT
    AM->>CH: useQuery(api.users.viewer)
    CH-->>AM: { id, name, email, image, provider } or null
```

Accounts link on **verified email**, so signing in with GitHub and later Google
on the same address lands on one user. Tokens live in `localStorage`, not
httpOnly cookies — the trade and its trigger for reversal are in
[decisions.md D11](../decisions.md#d11). A signed-in user's first paint has no
account UI, because `viewer` resolves over the websocket.

## Planned: publish and open a share link

Not built. Specified in [sharing.md](sharing.md).

```mermaid
sequenceDiagram
    participant C as Creator
    participant E as Editor
    participant M as convex tierlists.publish
    participant DB as tierlists table
    participant V as Viewer
    participant P as /t/[slug] server component

    C->>E: Share
    E->>M: publish({ data: SaveFile })
    M->>M: validate size, item count, strip HTML, rate limit
    M->>DB: insert { slug, data, ownerId or editTokenHash }
    M-->>E: { slug, editToken? }
    E->>E: store token (anonymous publish only)
    E-->>C: copyable link
    V->>P: GET /t/slug
    P->>DB: one read
    DB-->>P: SaveFile
    P-->>V: rendered board + OG tags, zero catalog API calls
```

The published page needs **no** external API calls: titles and image URLs are
already denormalised into the save file's `media` map. That property is the
reason the data model is shaped the way it is — don't break it.
