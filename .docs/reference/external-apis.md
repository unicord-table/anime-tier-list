# External APIs

Every claim below was checked against the live API on **2026-08-01** and the
observed response recorded. These are third-party services — re-verify before
depending on anything here.

> **Scope note.** This page documents anime sources. Once the source registry
> lands, each new source gets its own section here, and the contract every
> source must satisfy lives in
> [architecture/catalog-sources.md](../architecture/catalog-sources.md).
> Google Drive below belongs to a plan that is now **superseded** — server-side
> lists replace it. Kept for the scope research, which is still accurate.

---

## AniList GraphQL — primary source

`POST https://graphql.anilist.co`

| Property | Observed |
| --- | --- |
| API key | Not required for public reads |
| CORS | `Access-Control-Allow-Origin: *` |
| Rate limit | `X-RateLimit-Limit: 30` (per minute, per IP) |
| Limit headers | Exposed via `Access-Control-Expose-Headers` — readable from the browser |
| Auth for user lists | None, for public profiles |

The exposed rate-limit headers are the useful part: the client can read
`X-RateLimit-Remaining` and back off before getting a 429, rather than guessing.

### Search

```graphql
query ($s: String) {
  Page(perPage: 10) {
    media(search: $s, type: ANIME, sort: SEARCH_MATCH) {
      id idMal
      title { romaji english }
      seasonYear format episodes averageScore
      coverImage { large }
    }
  }
}
```

Verified response for `s: "frieren"`:

```jsonc
{ "id": 154587, "title": { "romaji": "Sousou no Frieren",
  "english": "Frieren: Beyond Journey’s End" },
  "seasonYear": 2023, "format": "TV", "averageScore": 91, "episodes": 28 }
```

Maps onto `Media` in [architecture/data-model.md](../architecture/data-model.md) field-for-field.

### Import a user's list

One request returns the entire collection, including custom lists.

```graphql
query ($u: String) {
  MediaListCollection(userName: $u, type: ANIME) {
    user { mediaListOptions { scoreFormat } }
    lists {
      name
      entries {
        score status
        media { id idMal title { romaji english } coverImage { large } }
      }
    }
  }
}
```

Verified against four public profiles. Sample shape of the response:

```
Mayonnaise -> [('Paused', 169), ('Completed', 260), ('Best anime ', 49), ('Planning', 779), ('Dropped', 1)]
Gigi       -> [('Completed TV', 180), ('Completed OVA', 29), ('Completed ONA', 32), ...]
```

**Two things that will bite you:**

1. **`score` is not on a fixed scale.** It follows the *user's* `scoreFormat`.
   Observed in testing: one profile returned `9` (POINT_10) and another `78`
   (POINT_100) for equivalent ratings. Always request
   `user { mediaListOptions { scoreFormat } }` and normalize. Formats are
   `POINT_100`, `POINT_10_DECIMAL`, `POINT_10`, `POINT_5`, `POINT_3`.
2. **Private profiles return HTTP 404** with `"message": "Private User"` inside
   `errors`, not a network failure. Handle it as a normal user-facing message.

Custom list names are arbitrary user text (`"Best anime "` — note the trailing
space). Don't assume `Completed`/`Watching`/`Planning` are the only names.

---

## Jikan — fallback only

`https://api.jikan.moe/v4` — unofficial MAL API, no key, CORS enabled
(`Access-Control-Allow-Origin: *` confirmed).

**Reliability caveat, observed directly during testing on 2026-08-01:**
responses were intermittently `504` across multiple endpoints in the same
session.

```
200  /v4/anime?q=naruto&limit=1
504  /v4/anime/154587
200  /v4/top/anime?limit=1
504  /v4/random/anime
504  /v4/seasons/now?limit=2
```

Same endpoint succeeded and failed minutes apart, so this reads as transient
load, not removal. Either way: **do not make Jikan the primary path.** If you use
it at all, retry with backoff and fall back to AniList. Documented rate limit is
3 req/sec and 60 req/min.

Reach for Jikan only when you need something AniList genuinely lacks. Since
AniList returns `idMal` on every result, MAL cross-referencing is already free
without calling Jikan at all.

---

## MyAnimeList API v2 — Phase 4 only

`https://api.myanimelist.net/v2` — docs reachable at
`myanimelist.net/apiconfig/references/api/v2`.

Needs a registered app, OAuth2 + PKCE, and token refresh. The client secret must
stay server-side, which is fine once Phase 2 exists.

Worth it **only for writing** to a user's real MAL list. Reading a public list
already works with zero auth in Phase 1, so don't take on OAuth for reads.

---

## Google Drive — Phase 3

Scope: `https://www.googleapis.com/auth/drive.appdata`

**Classified non-sensitive** by Google, alongside `drive.file` — confirmed
2026-08-01 against Google's "Choose Google Drive API scopes" guide. Non-sensitive
scopes need only basic OAuth verification; they do **not** trigger the
sensitive-scope review or the restricted-scope security assessment that
`drive.readonly` and full `drive` do.

That is the entire reason to use `appdata`: it writes to a hidden per-app folder,
so it can't touch the user's real files, and Google's review process reflects
that. Do not "simplify" this to the full `drive` scope — it would trade a
weekend for a multi-week security assessment.

Sync model: single file `tierlists.json` in the app-data folder. On load, compare
`updatedAt` local vs remote; newest wins; prompt only when both changed since the
last sync.

---

## Cover images

Hotlinked from `https://s4.anilist.co/...`.

> **Correction (2026-08-08).** This section previously said a `next.config.ts`
> `remotePatterns` entry is required. It is not: the app renders plain `<img>`,
> never `next/image`, and `next.config.ts` has no `images` block. What *is*
> required is that every `<img>` hitting AniList's CDN uses the same request
> mode — see [frontend/design-system.md](../frontend/design-system.md#images)
> and `src/lib/img.ts`.

The real win isn't bandwidth — it's that no user ever uploads an image, so the
app has no image storage, no CDN bill, and no moderation obligation. Keep it that
way.
