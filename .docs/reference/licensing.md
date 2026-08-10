# License

**Decision: MIT.** See [`LICENSE`](../../LICENSE), contributor terms in
[`CONTRIBUTING.md`](../../CONTRIBUTING.md).

---

## Constraints found in the repo

**Dependency licences** (344 packages in `node_modules`, direct + transitive):

| Licence | Count | Notes |
| --- | --- | --- |
| MIT | 296 | Includes next, react, dnd-kit, nanoid, html-to-image, tailwind |
| Apache-2.0 | 19 | Includes `@phosphor-icons/react` (MIT), typescript (Apache-2.0) |
| ISC / BSD-2 / BSD-3 / 0BSD | 23 | Permissive |
| MPL-2.0 | 3 | `lightningcss` (+ platform binary), `axe-core` |
| CC-BY-4.0 | 1 | `caniuse-lite` — browser-support data |
| Python-2.0 | 1 | `argparse` polyfill |
| Apache-2.0 AND LGPL-3.0-or-later | 1 | `@img/sharp-win32-x64` — prebuilt binary |

Nothing here blocks MIT:

- **MPL-2.0** is file-level copyleft. It reaches only modified MPL files.
  `lightningcss` is a build-time CSS transform, `axe-core` a dev-time
  accessibility checker; neither is modified and neither ends up in shipped
  output. Obligation: leave their notices intact — which npm does.
- **LGPL-3.0-or-later** (`sharp`'s optional platform binary) is the only
  copyleft that could matter, and only under two conditions this project does
  not meet: static linking, or shipping a modified binary. It is an optional
  Next.js image-optimisation dependency, dynamically loaded, unmodified, and
  server-side only. No source-disclosure obligation for the app.
- **CC-BY-4.0** (`caniuse-lite`) requires attribution when the *data* is
  redistributed. Browserslist consumes it at build time; the dataset is not in
  the bundle.
- All licences above are one-way compatible into an MIT-licensed work. Adding a
  GPL dependency later would break this — that is the one thing to watch.

**Assets.** No anime images, covers, or catalogue data are stored in this repo.
Everything comes from the AniList API at runtime, so no third-party media
licence attaches to the source tree. That is the single biggest reason a
permissive licence is clean here.

The only bundled binaries are Next.js starter placeholders — `public/next.svg`,
`public/vercel.svg`, `public/file.svg`, `public/globe.svg`, `public/window.svg`,
and `src/app/favicon.ico`. `next.svg` and `vercel.svg` are Vercel trademarks;
trademark is not covered by MIT, and an MIT grant on the repo does not grant
anyone rights to those marks. **All five SVGs are unreferenced by any source
file** (`grep` returns nothing) — deleting them removes the question entirely.

**Runtime terms, not licence terms.** Anime metadata and cover art from AniList
are governed by AniList's API terms and by the rightsholders of the artwork, not
by this project's licence. Downstream forks inherit that obligation regardless
of which licence is chosen. `CONTRIBUTING.md` says so explicitly.

---

## Project intentions (inferred, confirm if wrong)

| Question | Answer this repo implies |
| --- | --- |
| Commercial downstream use | Allowed. No reason to block it; there is no product to protect. |
| Contributions permissive or copyleft | Permissive. A client-side tier-list editor gains nothing from forced source disclosure. |
| Patent grant needed | No meaningful patent surface. dnd-kit wiring and a GraphQL client are not patentable subject matter anyone would assert. |
| Adoption vs control | Adoption. `README` frames this as a tool to use and fork. |

---

## Candidates

### MIT — recommended

**Pros.** Shortest licence anyone actually reads. Matches 86% of the dependency
tree, so no compatibility thinking required for contributors. Maximum adoption:
no company legal review blocks an MIT dependency. GitHub, npm, and every
scanner recognise it instantly. Compatible in both directions with Apache-2.0 and
absorbable into GPL projects if a downstream wants that.

**Cons.** No express patent grant. In practice this is close to irrelevant here:
most jurisdictions read an implied patent licence into MIT's "use, copy, modify,
sell" grant, and there is no patentable invention in a drag-and-drop board. No
trademark clause either — but the project name is not registered, so there is
nothing to reserve.

### Apache-2.0

**Pros.** Explicit patent grant plus a retaliation clause: anyone who sues you
over a patent covering the code loses their licence. Explicit trademark
carve-out, which would tidy the Vercel-logo question if those files stayed.
`NOTICE` file mechanism for attribution. Preferred by large enterprises with a
patent posture.

**Cons.** 200 lines against MIT's 20. Requires shipping a change-notice on
modified files (§4b) — real friction for a fork, zero benefit here. Not
compatible with GPLv2 (only GPLv3), which narrows downstream reuse. The patent
grant is the whole reason to pick it, and this project has no patent surface to
grant.

### GPLv3

**Pros.** Forks that ship must publish source, so improvements come back.
Includes a patent grant and anti-tivoisation terms.

**Cons.** Wrong shape for the project. This is a static client-side Next.js app —
the most likely "fork" is someone redeploying it on their own Vercel account,
which GPLv3 does not even reach (network use is not distribution; that needs
AGPL). So the copyleft costs adoption without buying the protection it looks like
it buys. It would also bar the code from being embedded in the many
permissively-licensed projects that might otherwise vendor a tier-list widget,
and it forces every future dependency to be GPL-compatible.

**Verdict:** MIT. Apache-2.0 is the sane second choice and switching later is
cheap while the contributor list is short. GPLv3 does not fit a client-side app.

---

## Dual-licensing

Considered and rejected. Dual-licensing (e.g. AGPL + commercial) exists to sell
exceptions to copyleft — it needs a rightsholder able to relicense, meaning a CLA
on every contributor, plus someone to run sales. That is a company's licence
model, not a hobby project's. Revisit only if the hosted service becomes a
business.

---

## Follow-up for maintainers

1. **Confirm the copyright line.** `LICENSE` reads
   `Copyright (c) 2026 unicord-table and the Unicord contributors`. Swap in a
   personal or legal-entity name if that is preferred.
2. **Relicensing consent is not an issue yet.** Git history is five commits by
   one author (`Karl`) plus one merged PR from the same author. No third-party
   contributor has to be contacted. Add `LICENSE` before merging outside PRs and
   this stays true.
3. **Delete the unused starter SVGs** — `public/{next,vercel,file,globe,window}.svg`.
   Removes the Vercel trademark question and five dead files:
   ```bash
   git rm public/next.svg public/vercel.svg public/file.svg public/globe.svg public/window.svg
   ```
   Also replace `src/app/favicon.ico` if it is still the Next.js default.
4. **Add `"license": "MIT"` to `package.json`.** It currently says
   `"private": true` with no licence field. Keep `private` (it prevents
   accidental npm publish) and add the field — tooling and GitHub's licence
   detection both read it.
5. **Add a licence line to `README.md`**, e.g.
   `## License` / `MIT — see [LICENSE](LICENSE).`
6. **Watch for GPL dependencies.** The only realistic way to invalidate this
   analysis is adding one. `npx license-checker --summary` in CI catches it if
   that ever seems worth automating.
