# Design system

**Status: Built.** Tokens in `src/app/globals.css`, primitives in
`src/components/ui/`.

## The one rule

**Every piece of text renders through `ui/Text.tsx`.** Change a size or tone
there, not in a component. `Text` also exports `SectionLabel`.

This is the rule most likely to erode as the app grows into feed cards, profile
pages, and comment threads — each of which is a temptation to write
`className="text-sm text-neutral-400"` once. Don't; add a variant.

## Tokens

Dark-only, named "Nocturne". Declared as CSS custom properties in
`globals.css` and consumed through Tailwind v4's `@theme`, so
`bg-canvas`, `text-ink`, `text-accent-300`, `rounded-lg` all resolve to them.

### Surfaces and ink

| Token | Value |
| --- | --- |
| `--color-canvas` | `#161826` |
| `--color-surface` | `#232532` |
| `--color-ink` | `#e9e9ed` |
| `--color-divider` | `color-mix(in srgb, #e9e9ed 16%, transparent)` |
| `--color-muted` | `color-mix(in srgb, #e9e9ed 55%, transparent)` |
| `--color-card-ink` | `#f3f5fe` |
| `--color-card-ink-dim` | `#c8ccdb` |

### Accent and neutrals

`--color-accent` `#9184d9`, `--color-accent-2` `#a7a1db`, plus full
`--color-accent-100`…`900` and `--color-neutral-100`…`900` ramps.

### Shape and depth

| Token | Value |
| --- | --- |
| `--radius-sm` / `md` / `lg` | `4px` / `8px` / `14px` |
| `--shadow-sm` | `0 0 0 1px #3f424d` |
| `--shadow-md` | `0 0 0 1px #595d6c, 0 6px 18px rgba(0,0,0,.55)` |
| `--shadow-lg` | `0 0 0 1px #9397ab, 0 16px 40px rgba(0,0,0,.65)` |

Shadows carry a 1px ring as their first layer, so elevation and border are one
token. Don't add a separate `border` next to a shadow.

### Type

`--font-heading` and `--font-body` both resolve to `var(--font-inter)`, loaded
via `next/font/google` in `src/app/layout.tsx` at weights 400/500/600/700 with
the `--font-inter` CSS variable.

> **Duplication to watch.** `#161826` appears twice: as `--color-canvas` and
> hardcoded as `backgroundColor` in `exportPng` (`TierListApp.tsx`), because
> `html-to-image` needs a concrete colour. Change one, change both.

## Primitives

| Component | Notes |
| --- | --- |
| `Text` | The only text API. See the variant/tone tables below |
| `SectionLabel` | Exported from `Text.tsx` — `variant="sectionLabel" tone="subtle"` |
| `Brand` | The logo lockup — header and sign-in modal render the same one |
| `Button` | Text actions — `primary` / `secondary` / `ghost`, plus `social`, the taller filled OAuth button in the sign-in modal |
| `IconButton` | Icon-only actions — the tool rail, tier controls |
| `TextInput` | Board title, tier label, search, import handle |
| `Segmented` | Catalog's search/import tab switch |
| `Modal` | Detail modal, sign-in modal |
| `Tag` | Genre chips in the detail modal |
| `Toast` | One at a time, driven by `useToast` |
| `ExternalLink` | Outbound links — AniList, MyAnimeList |

`cn.ts` is a 3-line class joiner. There is no `clsx`, no `tailwind-merge`, and
no `cva`.

> **Consequence, and it has already bitten once.** Because nothing merges, two
> classes that set the same property are resolved by Tailwind's own ordering in
> the generated stylesheet — *not* by which one `cn` lists last. `Button`'s base
> used to carry `bg-transparent border-transparent`, which silently beat every
> variant's `border-accent` / `border-divider`: the Share and PNG buttons had
> invisible borders for as long as the component existed. The fix is the rule
> to follow: **a property belongs to exactly one layer.** If variants set it,
> the base must not, and every variant must set it. Overriding from a call site
> only reliably works for a property the primitive leaves alone (`max-w-[408px]`
> against a base that sets `w-*`).

### `Text` variants

| Variant | Size / weight | Used for |
| --- | --- | --- |
| `display` | 34px medium | Page-level heading (also via the `H1` helper) |
| `dialogTitle` | 23px medium | Nocturne h3 — the heading inside a modal |
| `title` | 17px semibold | Modal and panel titles |
| `tierLabel` / `tierLabelLg` | 21 / 23px bold | Tier row labels |
| `eyebrow` | 13px medium, uppercase, tracked | Overlines |
| `sectionLabel` | 12px semibold | Section headers |
| `body` | 15px | Prose — synopsis, descriptions |
| `ui` / `uiSm` | 14 / 13px medium | Buttons, controls |
| `label` | 12px | Field labels, card titles |
| `caption` | 11px | Secondary metadata |
| `micro` | 9px semibold | Badges |

### `Text` tones

`default` (ink) · `muted` · `subtle` · `dim` · `faint` · `accent` ·
`accentSoft` · `card` · `cardDim` · `onTier` · `inherit`

`card` / `cardDim` are for text over cover art; `onTier` is for text on a tier's
user-chosen colour. `inherit` emits no colour class — use it inside a component
that already sets one.

## Icons

`@phosphor-icons/react`, listed in `next.config.ts` under
`experimental.optimizePackageImports`. Phosphor exports a few thousand modules
and is not optimized by default; without that entry every icon import pulls the
whole set in dev. Adding another large icon-per-module package means adding it
to that array.

## Images

Plain `<img>`, deliberately — not `next/image`. AniList's CDN already serves
correctly-sized covers, so the optimizer would add a hop and a `remotePatterns`
entry for someone else's CDN.

> **Discrepancy.** The old roadmap's Phase 0 instructed adding
> `images.remotePatterns` for `s4.anilist.co` to `next.config.ts`. That is not
> in `next.config.ts` and is not needed, because `next/image` is never used.
> Corrected here.

`src/lib/img.ts` exports `retryCover`, a one-shot cache-busting retry. The cause
is genuinely obscure and documented in the file: AniList's CDN only sends
`Access-Control-Allow-Origin` when the request carries an `Origin`, and the
browser's HTTP cache does not key on request mode — so a copy cached by a plain
request has no ACAO header and every `crossOrigin="anonymous"` `<img>` fails
against it. A cache-busted URL is a fresh cache entry, so one retry clears it.

**All AniList `<img>` elements must use the same request mode.** Mixing
`crossOrigin` and non-`crossOrigin` requests for the same URL is what creates the
poisoned cache entry in the first place. `AnimeCard`, `AnimeDetailModal`, and
`AccountMenu` all follow this.

## Layout

`layout.tsx` sets `h-full` on `<html>` and `h-full overflow-hidden` on `<body>`:
the editor is an app-shell layout, not a scrolling document. The board scrolls
in its own container inside `BoardEditor`; the page does not.

> **This will not survive the feed.** A newsfeed, a profile page, and a public
> board are all scrolling documents. Expect `overflow-hidden` on `<body>` to
> move out of the root layout and into a route group for the editor when those
> routes land. Plan for it rather than discovering it.

## Adding a component

1. If it renders text, it uses `Text`. If `Text` lacks the variant, add the
   variant.
2. Colours come from tokens. No hex literals in components — the two exceptions
   are `TIER_PRESET_COLORS` (user-selectable tier colours, which are data, not
   theme) and the `exportPng` background noted above.
3. Presentational components take props; they don't fetch and don't read
   storage. See [components.md](../architecture/components.md#dependency-rules-to-keep).
4. Dark-only is currently an assumption, not a decision. If a light theme is
   ever wanted, the tokens are the right place and nothing else should need to
   change — which is the point of having them.
