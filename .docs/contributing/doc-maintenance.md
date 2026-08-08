# Keeping these docs true

This project is under continuous development, so the docs will be wrong within
weeks unless there are rules. There already were: the previous doc set claimed a
search cache that was never built, listed tier reordering as skipped after it
shipped, specced Postgres after Convex was adopted, and required a
`next.config.ts` entry the app never needed. Four wrong claims in six files, in
about a week of work.

That's not carelessness — it's what happens by default. These rules exist to
make it not the default.

## The one rule

**Every claim must be traceable to code.** When code and a doc disagree, the
code is right and the doc is a bug. When something can't be verified, say so
explicitly rather than guessing.

## Status labels

Every page and every non-obvious claim carries one:

| Label | Means |
| --- | --- |
| **Built** | Verified against code, with the date of verification |
| **Planned** | Designed here, no code. Do not cite as fact |
| **Inferred** | Believed true from indirect evidence. Says what the evidence is |
| **Open** | No decision. Needs a [decision entry](../decisions.md) |
| **Gap** | Known missing thing, deliberately recorded |

The costly failure is a **Planned** thing read as **Built** — someone builds on
a table that doesn't exist. Label generously.

## What to update, when

| You changed | Update, in the same PR |
| --- | --- |
| A persisted type | [data-model.md](../architecture/data-model.md) |
| A module's responsibility, or added one | [components.md](../architecture/components.md) |
| A flow (search, drag, save, auth) | [lifecycles.md](../architecture/lifecycles.md) |
| Board ops or the hook | [board-state.md](../frontend/board-state.md) |
| dnd-kit config | [drag-and-drop.md](../frontend/drag-and-drop.md) |
| Tokens or `ui/` | [design-system.md](../frontend/design-system.md) |
| An external API contract | [external-apis.md](../reference/external-apis.md) |
| Env vars, build, hosting | [deployment.md](../architecture/deployment.md), [auth.md](../architecture/auth.md) |
| *Why* — a trade-off, a rejected alternative | [decisions.md](../decisions.md) |
| Scope or priorities | [roadmap.md](../product/roadmap.md), [vision.md](../product/vision.md) |

**Shipping something previously marked Planned** means flipping the label to
Built *and* removing the "Planned" caveats in every page that references it.
Grep for the feature name before closing the PR.

## Decisions are append-only

Never edit a decision to reflect a new answer. Add a new numbered entry that
says **Supersedes Dn**, and mark the old one **Superseded by Dm** with its text
intact. [D2](../decisions.md#d2), [D7](../decisions.md#d7),
[D12](../decisions.md#d12), and [D13](../decisions.md#d13) all work this way.

The reasoning trail is worth more than tidiness. "We already tried that, here's
why it changed" is the single most useful thing an old doc can tell you.

Template: [adr-template.md](adr-template.md).

## Every skipped thing gets a trigger

"Not doing X" is only useful with the condition that would change it. Compare:

> ~~No server-side search proxy.~~
> **Add a proxy when** you want a shared cache across users **and** you've built
> caching good enough that the shared 30/min ceiling isn't a regression.

The first invites someone to relitigate it in six months. The second lets them
check.

## Diagrams

Mermaid, in the doc it belongs to. Validate before shipping:

```bash
npm install --no-save mermaid jsdom
node .claude/skills/architecture-docs/scripts/validate_mermaid.mjs .docs
```

A diagram that fails to parse renders blank, which is worse than no diagram.

Keep them dark-mode safe: no custom `style` with hardcoded colours; use
`classDef` with a light fill and a visible stroke, sparingly — datastores only.
Label edges rather than relying on colour.

## Periodic check

Cheap, and worth doing when a phase closes:

1. Grep every symbol, route, table, and env var the docs name; confirm each
   exists.
2. Re-run the Mermaid validator.
3. Confirm [README.md](../README.md) links every file and nothing is orphaned.
4. Re-verify external API claims in
   [external-apis.md](../reference/external-apis.md) — they're third-party
   services and the recorded date is how you know how stale they are.

## Writing style

Prose first; tables for reference; diagrams for structure and flow. Concrete
names from this repo, not generic examples. State the reasoning, not just the
conclusion — a doc that says *what* without *why* gets overwritten by the first
person who disagrees.

Short is better. A doc nobody finishes reading is a doc nobody reads.
