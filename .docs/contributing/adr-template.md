# Decision entry template

Copy into [decisions.md](../decisions.md), take the next number, keep the
format. Entries are append-only — see
[doc-maintenance.md](doc-maintenance.md#decisions-are-append-only).

Add a row to the index table at the top of `decisions.md`, and link the entry
from wherever it's relevant.

---

```markdown
## Dn — <the decision, as a claim, in one line>

**Decided YYYY-MM-DD.** [Supersedes Dx.]

<One paragraph: what the situation is and what question is being answered.
Include what the obvious/default answer would have been, so the reader knows
what was rejected.>

<The decision, and why. A table works well when comparing options:>

| | Option A | Option B |
| --- | --- | --- |
| <criterion that actually decided it> | | |

Consequences accepted:

- <What this costs. Be specific — "vendor coupling" is not a consequence,
  "migrating out means an export plus a rewrite of every function" is.>
- <What becomes harder or impossible.>

**Reconsider when:** <the concrete, checkable condition that would flip this.
Not "if it becomes a problem".>
```

---

## What makes an entry worth writing

Write one when the decision is **non-obvious** — when a reasonable engineer
would default to something else and needs to know why you didn't. The existing
entries are a good calibration:

- [D3](../decisions.md#d3) — a server proxy is the intuitive "proper"
  architecture and is strictly worse here. Without the entry, someone
  "fixes" it and caps the app at 30 req/min globally.
- [D5](../decisions.md#d5) — native drag-and-drop is free; the entry explains
  the three specific dnd-kit settings that exist because of specific failures.
- [D8](../decisions.md#d8) — `ssr: false` looks like giving up on SSR; the entry
  explains it removes a problem rather than working around one.

Don't write one for a decision with an obvious default and no trade-off. A doc
of trivia dilutes the entries that matter.

## What makes an entry bad

| Bad | Why |
| --- | --- |
| "We chose X because it's better" | No rejected alternative, no criterion |
| "Reconsider if it becomes a problem" | Not checkable. Nobody will ever decide it has |
| Consequences omitted | Every real decision costs something. An entry with no cost is marketing |
| Edited in place when it changed | Destroys the trail. Supersede instead |
| Written after the code, from memory | The alternatives you seriously considered are the valuable part, and they're the first thing forgotten |
