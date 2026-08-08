import { defineSchema } from "convex/server";
import { authTables } from "@convex-dev/auth/server";

/**
 * Auth tables only — boards still live in localStorage (see .docs/01-roadmap.md).
 * `authTables.users` already carries name / image / email and `authAccounts`
 * carries the provider, so there is nothing to add for a profile.
 */
export default defineSchema({
  ...authTables,
});
