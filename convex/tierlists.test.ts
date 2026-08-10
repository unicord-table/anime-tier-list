/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import { api } from "./_generated/api";
import schema from "./schema";
import { createEmptySave } from "../src/lib/board";
import { LIMITS } from "../src/lib/publish";
import type { Media, SaveFile } from "../src/lib/types";

/** Run with: npm run test:convex */

const modules = import.meta.glob("./**/*.ts");

const anime = (id: number, over: Partial<Media> = {}): Media => ({
  key: `al:${id}`,
  source: "anilist",
  id,
  idMal: null,
  title: `Anime ${id}`,
  titleEn: null,
  cover: `https://s4.anilist.co/file/anilistcdn/media/anime/cover/${id}.jpg`,
  year: 2024,
  format: "TV",
  color: "#aa3366",
  ...over,
});

function board(titles = 2, over: Partial<Media> = {}): SaveFile {
  const save = createEmptySave();
  const media: Record<string, Media> = {};
  const keys: string[] = [];
  for (let i = 1; i <= titles; i++) {
    const m = anime(i, over);
    media[m.key] = m;
    keys.push(m.key);
  }
  return {
    ...save,
    media,
    tiers: save.tiers.map((t, i) => (i === 0 ? { ...t, items: keys } : t)),
  };
}

/** A convexTest handle plus a signed-in identity backed by a real user row. */
async function signedIn(t: ReturnType<typeof convexTest>, name: string) {
  const userId = await t.run(async (ctx) => ctx.db.insert("users", { name }));
  return { userId, as: t.withIdentity({ subject: userId, name }) };
}

const setup = () => convexTest(schema, modules);

const publish = (
  as: ReturnType<ReturnType<typeof convexTest>["withIdentity"]>,
  over: Partial<{
    title: string;
    description: string;
    visibility: "public" | "unlisted" | "private";
    data: SaveFile;
  }> = {},
) =>
  as.mutation(api.tierlists.publish, {
    title: over.title ?? "Best of the decade",
    description: over.description ?? "Ten years, two shows.",
    visibility: over.visibility ?? "unlisted",
    data: over.data ?? board(),
  });

describe("publish", () => {
  test("stores the board and mints a share slug", async () => {
    const t = setup();
    const { as } = await signedIn(t, "Ronin");

    const { slug } = await publish(as);
    expect(slug).toHaveLength(10);

    const found = await t.query(api.tierlists.bySlug, { slug });
    expect(found).toMatchObject({
      title: "Best of the decade",
      description: "Ten years, two shows.",
      visibility: "unlisted",
      itemCount: 2,
      author: { name: "Ronin" },
    });
    expect(found!.data.tiers[0].items).toHaveLength(2);
    expect(found!.preview[0].swatches).toEqual(["#aa3366", "#aa3366"]);
  });

  test("refuses a signed-out caller", async () => {
    const t = setup();
    await expect(
      t.mutation(api.tierlists.publish, {
        title: "Anonymous",
        description: "",
        visibility: "public",
        data: board(),
      }),
    ).rejects.toThrow(/Sign in/);
  });

  test("sanitises the title and description it was handed", async () => {
    const t = setup();
    const { as } = await signedIn(t, "Ronin");
    const { slug } = await publish(as, {
      title: "<b>Bold</b> claims",
      description: "<script>alert(1)</script>ok",
    });

    const found = await t.query(api.tierlists.bySlug, { slug });
    expect(found!.title).toBe("Bold claims");
    expect(found!.description).toBe("alert(1)ok");
  });

  test("enforces the item cap with a message the publisher can act on", async () => {
    const t = setup();
    const { as } = await signedIn(t, "Ronin");
    await expect(publish(as, { data: board(LIMITS.items + 1) })).rejects.toThrow(
      new RegExp(String(LIMITS.items)),
    );
  });

  test("drops cover URLs that are not on the allowlist", async () => {
    const t = setup();
    const { as } = await signedIn(t, "Ronin");
    const { slug } = await publish(as, {
      data: board(1, { cover: "https://tracker.example/pixel.gif" }),
    });

    const found = await t.query(api.tierlists.bySlug, { slug });
    expect(found!.data.media["al:1"].cover).toBe("");
  });

  test("gives two boards two different slugs", async () => {
    const t = setup();
    const { as } = await signedIn(t, "Ronin");
    const first = await publish(as);
    const second = await publish(as);
    expect(first.slug).not.toBe(second.slug);
  });
});

describe("update", () => {
  test("changes metadata without needing the payload again", async () => {
    const t = setup();
    const { as } = await signedIn(t, "Ronin");
    const { id, slug } = await publish(as);

    await as.mutation(api.tierlists.update, {
      id,
      title: "Renamed",
      description: "New blurb",
      visibility: "public",
    });

    const found = await t.query(api.tierlists.bySlug, { slug });
    expect(found).toMatchObject({ title: "Renamed", visibility: "public", itemCount: 2 });
    expect(found!.data.tiers[0].items).toHaveLength(2);
  });

  test("replaces the payload, the counts and the thumbnail together", async () => {
    const t = setup();
    const { as } = await signedIn(t, "Ronin");
    const { id, slug } = await publish(as);

    await as.mutation(api.tierlists.update, {
      id,
      title: "Bigger",
      description: "",
      visibility: "unlisted",
      data: board(5, { color: "#112233" }),
    });

    const found = await t.query(api.tierlists.bySlug, { slug });
    expect(found!.itemCount).toBe(5);
    expect(found!.preview[0].swatches).toEqual(Array(5).fill("#112233"));
  });

  test("refuses another user's board", async () => {
    const t = setup();
    const owner = await signedIn(t, "Ronin");
    const stranger = await signedIn(t, "Nosy");
    const { id } = await publish(owner.as);

    await expect(
      stranger.as.mutation(api.tierlists.update, {
        id,
        title: "Mine now",
        description: "",
        visibility: "public",
      }),
    ).rejects.toThrow(/isn't yours/);
  });

  test("refuses a signed-out caller", async () => {
    const t = setup();
    const owner = await signedIn(t, "Ronin");
    const { id } = await publish(owner.as);

    await expect(
      t.mutation(api.tierlists.update, {
        id,
        title: "Mine now",
        description: "",
        visibility: "public",
      }),
    ).rejects.toThrow(/Sign in/);
  });
});

describe("remove", () => {
  test("deletes the owner's board and breaks the link", async () => {
    const t = setup();
    const { as } = await signedIn(t, "Ronin");
    const { id, slug } = await publish(as);

    await as.mutation(api.tierlists.remove, { id });
    expect(await t.query(api.tierlists.bySlug, { slug })).toBeNull();
  });

  test("refuses another user's board", async () => {
    const t = setup();
    const owner = await signedIn(t, "Ronin");
    const stranger = await signedIn(t, "Nosy");
    const { id, slug } = await publish(owner.as);

    await expect(
      stranger.as.mutation(api.tierlists.remove, { id }),
    ).rejects.toThrow(/isn't yours/);
    expect(await t.query(api.tierlists.bySlug, { slug })).not.toBeNull();
  });
});

describe("bySlug", () => {
  test("returns null for an unknown slug", async () => {
    const t = setup();
    expect(await t.query(api.tierlists.bySlug, { slug: "nope" })).toBeNull();
  });

  test("hides a private board from everyone but its owner", async () => {
    const t = setup();
    const owner = await signedIn(t, "Ronin");
    const stranger = await signedIn(t, "Nosy");
    const { slug } = await publish(owner.as, { visibility: "private" });

    expect(await t.query(api.tierlists.bySlug, { slug })).toBeNull();
    expect(await stranger.as.query(api.tierlists.bySlug, { slug })).toBeNull();

    const mine = await owner.as.query(api.tierlists.bySlug, { slug });
    expect(mine).not.toBeNull();
    expect(mine!.isOwner).toBe(true);
  });

  test("marks a stranger as not the owner, which is what gates editing", async () => {
    const t = setup();
    const owner = await signedIn(t, "Ronin");
    const stranger = await signedIn(t, "Nosy");
    const { slug } = await publish(owner.as, { visibility: "public" });

    expect((await stranger.as.query(api.tierlists.bySlug, { slug }))!.isOwner).toBe(false);
    expect((await t.query(api.tierlists.bySlug, { slug }))!.isOwner).toBe(false);
  });
});

describe("mine", () => {
  const page = { numItems: 10, cursor: null };

  test("lists only the caller's boards, newest first", async () => {
    const t = setup();
    const owner = await signedIn(t, "Ronin");
    const other = await signedIn(t, "Nosy");

    await publish(owner.as, { title: "First" });
    await publish(owner.as, { title: "Second" });
    await publish(other.as, { title: "Not mine" });

    const result = await owner.as.query(api.tierlists.mine, { paginationOpts: page });
    expect(result.page.map((b) => b.title)).toEqual(["Second", "First"]);
  });

  test("includes private boards — they are the owner's to see", async () => {
    const t = setup();
    const owner = await signedIn(t, "Ronin");
    await publish(owner.as, { title: "Secret", visibility: "private" });

    const result = await owner.as.query(api.tierlists.mine, { paginationOpts: page });
    expect(result.page).toHaveLength(1);
  });

  test("is empty rather than an error when signed out", async () => {
    const t = setup();
    const owner = await signedIn(t, "Ronin");
    await publish(owner.as);

    const result = await t.query(api.tierlists.mine, { paginationOpts: page });
    expect(result).toMatchObject({ page: [], isDone: true });
  });

  test("paginates", async () => {
    const t = setup();
    const owner = await signedIn(t, "Ronin");
    for (const title of ["a", "b", "c"]) await publish(owner.as, { title });

    const first = await owner.as.query(api.tierlists.mine, {
      paginationOpts: { numItems: 2, cursor: null },
    });
    expect(first.page).toHaveLength(2);
    expect(first.isDone).toBe(false);

    const second = await owner.as.query(api.tierlists.mine, {
      paginationOpts: { numItems: 2, cursor: first.continueCursor },
    });
    expect(second.page).toHaveLength(1);
  });
});

describe("feed", () => {
  test("shows public boards only — unlisted and private stay out", async () => {
    const t = setup();
    const { as } = await signedIn(t, "Ronin");
    await publish(as, { title: "Open", visibility: "public" });
    await publish(as, { title: "Linked", visibility: "unlisted" });
    await publish(as, { title: "Secret", visibility: "private" });

    const feed = await t.query(api.tierlists.feed, {});
    expect(feed.map((b) => b.title)).toEqual(["Open"]);
  });

  test("is reverse-chronological", async () => {
    const t = setup();
    const { as } = await signedIn(t, "Ronin");
    for (const title of ["oldest", "middle", "newest"]) {
      await publish(as, { title, visibility: "public" });
    }

    const feed = await t.query(api.tierlists.feed, {});
    expect(feed.map((b) => b.title)).toEqual(["newest", "middle", "oldest"]);
  });

  test("never ships the board payload or the owner's email to a listing", async () => {
    const t = setup();
    const owner = await signedIn(t, "Ronin");
    await t.run(async (ctx) => {
      await ctx.db.patch(owner.userId, { email: "ronin@example.com" });
    });
    await publish(owner.as, { visibility: "public" });

    const [card] = await t.query(api.tierlists.feed, {});
    expect(card).not.toHaveProperty("data");
    expect(JSON.stringify(card)).not.toContain("ronin@example.com");
  });

  test("searches titles", async () => {
    const t = setup();
    const { as } = await signedIn(t, "Ronin");
    await publish(as, { title: "Mecha, ranked", visibility: "public" });
    await publish(as, { title: "Food anime", visibility: "public" });

    const hits = await t.query(api.tierlists.feed, { query: "mecha" });
    expect(hits.map((b) => b.title)).toEqual(["Mecha, ranked"]);
  });

  test("clamps the limit rather than trusting it", async () => {
    const t = setup();
    const { as } = await signedIn(t, "Ronin");
    for (let i = 0; i < 3; i++) await publish(as, { title: `b${i}`, visibility: "public" });

    expect(await t.query(api.tierlists.feed, { limit: 0 })).toHaveLength(1);
    expect(await t.query(api.tierlists.feed, { limit: 9999 })).toHaveLength(3);
  });
});
