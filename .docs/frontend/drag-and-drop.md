# Drag and drop

**Status: Built.** `@dnd-kit` wiring lives in
`src/components/board/BoardEditor.tsx` and `src/components/dnd/DragParts.tsx`.

This is the most subtle code in the repo. Most of it exists because of specific
failures, so read the reasoning before changing a setting.

Why `@dnd-kit` and not native HTML5 drag-and-drop at all:
[decisions.md D5](../decisions.md#d5). Short version — native DnD does not fire
on touch and offers no keyboard path, and tier lists get built on phones.

## Two sortable axes on one board

There are two independent drag types sharing one `DndContext`:

| Type | Dragged | Dropped on |
| --- | --- | --- |
| Cards | A cover tile, or a catalog result | A tier row, the pool, or another tile |
| Tiers | A whole tier row (by its handle) | Another tier row |

`DragData` in `DragParts.tsx` discriminates them by `type`:
`"catalog" | "board" | "tier"`, plus `"region"` for the droppable regions.

## Collision detection

The default strategies are all wrong here, and it is worth understanding why.

```ts
const collisionDetection: CollisionDetection = (args) => {
  const isTier = (data) => data?.type === "tier";

  // 1. Split the candidate set by drag type
  const containers = args.droppableContainers.filter(
    (c) => isTier(c.data.current) === isTier(args.active.data.current),
  );

  // 2. Tiers use closestCenter among tiers only
  if (isTier(args.active.data.current)) {
    return closestCenter({ ...args, droppableContainers: containers });
  }

  // 3. Cards use pointerWithin, falling back to rectIntersection
  const scoped = { ...args, droppableContainers: containers };
  const hits = pointerWithin(scoped);
  return hits.length ? hits : rectIntersection(scoped);
};
```

**Step 1 — splitting the candidate set.** A dragged tier rect overlaps every
card droppable it passes over. Without the split, those card droppables win the
collision and tier reordering becomes unusable. A tier only ever drops on a
tier; a tile never drops on a tier handle.

**Step 2 — `closestCenter` for tiers.** Rows are a simple vertical list; centre
distance is exactly right.

**Step 3 — `pointerWithin`, not `closestCorners`/`closestCenter`, for cards.**
Distance-based detection scores the *dragged rect* against every droppable. A
tier row is a wide rect and a cover tile is a small one, so a stray tile several
rows away routinely scored better than the row the cursor was actually inside —
in practice only the topmost tier ever accepted a drop. `pointerWithin` returns
only the droppables under the pointer, nearest centre first: the tile when
you're over one (which supplies the slot index), the row otherwise.

**The `rectIntersection` fallback** exists for keyboard drags, which have no
pointer, so `pointerWithin` always returns empty.

## Sensors

```ts
useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
useSensor(KeyboardSensor, {
  keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space"] },
  coordinateGetter: sortableKeyboardCoordinates,
})
```

- **6px activation distance** keeps a plain click a click. Without it, tapping a
  cover starts a drag instead of opening the detail modal.
- **Space-only keyboard drag.** The default also claims Enter, which collides
  with Enter-to-open-details. Both bindings are rebound together (`start` and
  `end`), so they stay symmetric.

## Resolving the drop

```ts
function resolveTarget(over: Over): { region: Region; index: number | null } | null
```

| `over.data.current.type` | Result |
| --- | --- |
| `"region"` | `{ region, index: null }` — append to the end |
| `"board"` | `{ region, index: sortable.index }` — take that tile's slot |
| anything else | `null` — ignore the drop |

`Region` is `"pool" | \`tier:${string}\`` (`src/lib/types.ts`), so one string
identifies any target and `tierIdOf` extracts the id.

Then `onDragEnd` dispatches by the *source*: a `"catalog"` drag calls
`store.addMedia` (registering the media record), a `"board"` drag calls
`store.moveItem`.

## The drag overlay

`DragOverlay` renders a bare `AnimeCard` with `interactive={false}` and
`dropAnimation={null}`. It is rendered outside the sortable tree, which is why
`AnimeCard` must stay usable with no dnd context — keep drag wiring in
`DragParts`, not in the card.

## Keyboard and screen readers

`@dnd-kit` supplies sensors and announcements out of the box; that was a main
reason for choosing it. What is **not** verified:

> **Gap.** No accessibility pass has been run on the board. Unknowns: whether
> the default announcements name tiers usefully (a tier's label is user-editable
> free text), whether focus lands somewhere sensible after a keyboard drop, and
> whether the 6px pointer constraint interacts badly with assistive pointing
> devices. Worth an audit before the board becomes public-facing content.

## Tier reordering

Two paths, both ending at `store.reorderTiers(id, beforeId)`:

- **Drag** the tier handle onto another tier (`onDragEnd`, `type === "tier"`).
- **Keyboard/buttons** via `moveTierBy(id, delta)` in `BoardEditor`, which looks
  up the neighbour at `index + delta` and passes its id.

`board.reorderTiers` splices out and splices in at the target's index, and
returns `save` unchanged when `from === to` or either id is unknown.

> The old roadmap listed "Reordering tier rows" as deliberately skipped. It
> shipped in commit `11405ee`. That table entry is stale and is corrected in
> [decisions.md D10](../decisions.md#d10).

## When you change something here

Check all six, because each has broken at least once:

- [ ] Drag a catalog result onto a tier row's empty space
- [ ] Drag a catalog result onto a specific slot between two existing tiles
- [ ] Reorder two tiles within one row
- [ ] Move a tile from a row to the pool and back
- [ ] Drag a tier row past several rows containing tiles
- [ ] Tab to a tile, Space, arrows, Space — and confirm Enter still opens details
