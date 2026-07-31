# Data model

One shape, four homes: `localStorage`, the exported `.json`, the Postgres `data`
column, and (Phase 3) the Drive app-data file. Adding a fifth home should require
zero new types.

## SaveFile

```ts
type SaveFile = {
  schema: 1;
  title: string;
  updatedAt: string;              // ISO 8601
  tiers: Tier[];
  pool: MediaKey[];               // added but not yet ranked
  media: Record<MediaKey, Media>; // lookup table, see note below
};

type Tier = {
  id: string;                     // nanoid(6)
  label: string;                  // "S", "peak fiction", whatever
  color: string;                  // hex
  items: MediaKey[];              // ordered
};

/** `${source}:${id}` — e.g. "al:154587", "mal:52991" */
type MediaKey = string;

type Media = {
  key: MediaKey;
  source: "anilist" | "mal";
  id: number;
  idMal: number | null;           // cross-source join key
  title: string;                  // romaji
  titleEn: string | null;
  cover: string;                  // absolute CDN url
  year: number | null;
  format: string | null;          // TV, MOVIE, OVA, ONA, SPECIAL
  color?: string | null;          // AniList's dominant cover colour
};
```

### Two rules that matter

**`media` is a lookup table, not inline data.** Tiers and the pool hold keys
only. A title dragged between rows changes one array element, never a copy of its
metadata. Without this you get drift where the same anime has two different cover
URLs in two rows.

**`MediaKey` is prefixed by source.** Mixing AniList and MAL results in one board
works immediately, and `idMal` gives you the join key to dedupe later if a title
gets added from both. Costs nothing now; retrofitting it later means migrating
every saved file.

### Example

```jsonc
{
  "schema": 1,
  "title": "Best of 2023",
  "updatedAt": "2026-08-01T12:00:00.000Z",
  "tiers": [
    { "id": "a1b2c3", "label": "S", "color": "#ff7f7f", "items": ["al:154587"] },
    { "id": "d4e5f6", "label": "A", "color": "#ffbf7f", "items": [] }
  ],
  "pool": ["al:21"],
  "media": {
    "al:154587": {
      "key": "al:154587",
      "source": "anilist",
      "id": 154587,
      "idMal": 52991,
      "title": "Sousou no Frieren",
      "titleEn": "Frieren: Beyond Journey's End",
      "cover": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx154587-qQTzQnEJJ3oB.jpg",
      "year": 2023,
      "format": "TV"
    }
  }
}
```

### Versioning

`schema` starts at `1`. Bump it only for a **breaking** change, and when you do,
write a migration function that takes any older version and returns the current
one. Run it on every load — from localStorage, from an uploaded file, from Drive.
Additive fields don't need a bump; just make them optional.

---

## Database (Phase 2)

Postgres. One table. The `data` column is a `SaveFile` verbatim.

```sql
create table tierlists (
  id          text primary key,           -- nanoid(10), url-safe
  edit_token  text not null,              -- sha256 of the token, never the raw value
  title       text not null default 'Untitled',
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  views       integer not null default 0
);
```

`title` is duplicated out of `data` on purpose — it's the only field ever needed
without parsing the blob (OG tags, any future listing page).

**Edit token:** generated server-side on publish, returned once, stored in the
client's localStorage next to the save file. Only its hash is stored. Losing it
means losing edit rights to that link, which is the correct tradeoff for a
no-accounts app — the user still has their local copy and can republish.

---

## Routes

| Route | Type | Notes |
| --- | --- | --- |
| `/` | client | The editor. All state in localStorage. |
| `/t/[id]` | server | Read-only. One DB read, no external API calls. |
| `POST /api/tierlists` | route | Publish → `{ id, editToken }` |
| `PATCH /api/tierlists/[id]` | route | Requires `x-edit-token`, compares hash |
| `GET /api/tierlists/[id]` | route | Only if you need client-side fetch; `/t/[id]` doesn't |

There is **no** `/api/search`. Search goes browser → AniList directly. See
[04-decisions.md](04-decisions.md#d3) for when to add a proxy.

## localStorage keys

| Key | Value |
| --- | --- |
| `atl:save` | current `SaveFile` |
| `atl:tokens` | `Record<tierlistId, editToken>` |

Namespaced so a future second tool on the same origin can't collide.

## Validation

Parse anything crossing a trust boundary — an uploaded `.json`, whatever is in
localStorage, and later `POST` bodies and data read back from Drive. A malformed
save file must produce an error message, never a white screen. This is the one
place in the app where being thorough is cheaper than being lazy.

`parseSaveFile` in [`storage.ts`](../src/lib/storage.ts) is hand-written rather
than zod. It is one shape, and the check that actually matters is referential
integrity — that every key in `tiers` and `pool` resolves in `media` — which a
schema library would need a custom refinement for anyway. Unresolvable keys are
dropped rather than rendering an undefined card. Reach for zod if a second or
third shape ever needs validating.
