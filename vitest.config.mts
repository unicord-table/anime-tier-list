import { defineConfig } from "vitest/config";

/**
 * Convex functions only. The rest of the suite is plain `node --test` against
 * `src/lib/*.test.ts` — `convex-test` needs a real module graph and an
 * edge-runtime VM, which is the one thing that cannot run without a runner.
 */
export default defineConfig({
  test: {
    environment: "edge-runtime",
    include: ["convex/**/*.test.ts"],
    server: { deps: { inline: ["convex-test"] } },
  },
});
