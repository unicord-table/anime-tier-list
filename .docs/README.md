# Docs

Planning docs for anime-tier-list. Written before any code exists — treat them as
the intended design, not a description of what's built.

| Doc | Read it when |
| --- | --- |
| [01-roadmap.md](01-roadmap.md) | Deciding what to build next |
| [02-data-model.md](02-data-model.md) | Touching the save file, DB, or routes |
| [03-apis.md](03-apis.md) | Calling an external API |
| [04-decisions.md](04-decisions.md) | Wondering "why is it done this way" |

## The one-paragraph version

A Next.js app where the **editor is fully client-side** — search hits AniList
directly from the browser (CORS is open, no key needed), and the board autosaves
to localStorage. The server exists for exactly one reason: storing published tier
lists so `/t/{id}` links work. Everything is one JSON shape (`SaveFile`) that
lives identically in localStorage, in an exported `.json`, in the Postgres `data`
column, and later in Google Drive — so no phase requires rewriting the previous
one.

## Ground rules

1. **No accounts.** Publishing returns an edit token kept in localStorage. Sign-in
   only ever gets added for Drive sync, and stays optional.
2. **No user uploads.** Cover art is hotlinked from AniList's CDN. This is not a
   perf decision — it means there is no image moderation surface at all.
3. **One schema.** If you add a field, add it to `SaveFile` and bump `schema`.
   Never invent a second shape for "just the DB" or "just the export".
4. **Verify API claims.** Everything asserted in [03-apis.md](03-apis.md) was
   checked against the live API on 2026-08-01, with the observed response
   recorded. Re-check before relying on it; these are third-party services.
