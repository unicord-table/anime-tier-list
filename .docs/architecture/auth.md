# Auth

**Status: Built.** Optional Google/GitHub sign-in via Convex Auth. It currently
gates nothing.

## What's in the repo

| File | Role |
| --- | --- |
| `convex/auth.ts` | `convexAuth({ providers: [Google, GitHub] })`; exports `auth`, `signIn`, `signOut`, `store`, `isAuthenticated` |
| `convex/auth.config.ts` | Trusts JWTs issued by this deployment — `domain: process.env.CONVEX_SITE_URL`, `applicationID: "convex"` |
| `convex/http.ts` | `auth.addHttpRoutes(http)` — serves JWKS and `/api/auth/signin/*`, `/api/auth/callback/*` |
| `convex/schema.ts` | `defineSchema({ ...authTables })` — no custom tables |
| `convex/users.ts` | `viewer` query |
| `src/components/ConvexClientProvider.tsx` | Creates the client, or `null` when unconfigured |
| `src/components/auth/AccountMenu.tsx` | Sign-in modal, avatar, sign-out |

Neither provider declares a `scope`. The defaults — `openid email profile` for
Google, `read:user user:email` for GitHub — are exactly the name, avatar, and
email stored. Don't widen them without a reason.

**Account linking is on verified email.** Signing in with GitHub and later with
Google on the same address lands on one user, not two. Both providers return a
verified email, which is why only these two are enabled.

## Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `CONVEX_DEPLOYMENT` | `.env.local` | Which deployment `npx convex dev` targets |
| `NEXT_PUBLIC_CONVEX_URL` | `.env.local` | Websocket URL for `ConvexReactClient`. **Unset ⇒ no account UI** |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | `.env.local` | Convex HTTP origin (`.convex.site`), for OAuth redirects |
| `CONVEX_SITE_URL` | Convex deployment env | Read by `auth.config.ts`. Set by Convex, not by you |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Convex deployment env | Google OAuth client |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | Convex deployment env | GitHub OAuth app |
| `JWT_PRIVATE_KEY`, `JWKS` | Convex deployment env | Written by `@convex-dev/auth`'s init |

The split matters: `NEXT_PUBLIC_*` go in `.env.local` and ship to the browser;
provider secrets go in the **Convex** deployment environment
(`npx convex env set …` or the dashboard) and never touch the Next.js build.

## Running without Convex

`ConvexClientProvider` exports `convex` as `null` when `NEXT_PUBLIC_CONVEX_URL`
is unset and renders children with no provider. The account UI hides itself; the
editor is unaffected.

**Every consumer of a Convex hook must null-check `convex` first** — `useQuery`
and friends throw without a provider above them. `AccountMenu` does this; any
new component that reads `viewer` must too.

This is worth preserving. It is what makes `git clone && npm install && npm run
dev` work for a contributor with no Convex account, and it keeps sign-in honestly
optional rather than nominally optional.

## Using auth in code

```tsx
// Client
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { convex } from "@/components/ConvexClientProvider";

const viewer = useQuery(api.users.viewer);   // undefined = loading, null = signed out
```

```ts
// Server — reads
const userId = await getAuthUserId(ctx);
if (userId === null) return null;            // signed out is a normal answer

// Server — writes (Planned helper, see social-feed.md)
const userId = await requireUser(ctx);       // throws
```

The asymmetry is deliberate and stated in `convex/users.ts`: **queries may
return `null`; mutations must throw.**

## Consequences of the `/react` client

`@convex-dev/auth/react`, not `/nextjs`. Full reasoning in
[decisions.md D11](../decisions.md#d11). Two consequences to keep in mind:

1. **Tokens are in `localStorage`, not httpOnly cookies.** This trades XSS
   resistance for not running a server. Cheap today — a session grants a name and
   an avatar. It stops being cheap the moment a mutation can destroy someone's
   data, which is exactly when likes and comments land
   ([social-feed.md](social-feed.md#likes)).
2. **First paint has no account UI.** `viewer` resolves over the websocket. Fine
   for a header chip; not fine if a route ever needs gating.

**Switch to `/nextjs` when** a server component or route handler needs to know
who the caller is. `/t/[slug]` showing viewer-specific state is the concrete
case — see [sharing.md](sharing.md#urls).

## Deliberately absent

Email/password, magic links, and anonymous accounts. Each is one line in
`convex/auth.ts`, and each brings back a piece of what OAuth-only avoids:
password storage, email verification, account recovery. Add one when someone
genuinely cannot use Google or GitHub.

---

# Setup

## Local development

```bash
npx convex dev
```

First run prompts you to log in and create a project, then writes `.env.local`
and watches `convex/` for changes. Leave it running alongside `npm run dev`.

```bash
npx @convex-dev/auth
```

Generates the JWT keypair and asks for your `SITE_URL` (`http://localhost:3000`).
Run once per deployment — dev and prod each need their own.

Then create the two OAuth apps and set the four secrets.

### Google

1. [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services**
   → **Credentials** → **Create credentials** → **OAuth client ID** → **Web application**.
2. Configure the consent screen if prompted. Scopes: the defaults
   (`openid`, `email`, `profile`) — nothing sensitive, so no verification review.
3. **Authorised redirect URI:**
   ```
   https://<your-deployment>.convex.site/api/auth/callback/google
   ```
4. Copy the client ID and secret:
   ```bash
   npx convex env set AUTH_GOOGLE_ID <client-id>
   npx convex env set AUTH_GOOGLE_SECRET <client-secret>
   ```

### GitHub

1. GitHub → **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**.
2. **Homepage URL:** `http://localhost:3000` (dev) or your real origin.
3. **Authorization callback URL:**
   ```
   https://<your-deployment>.convex.site/api/auth/callback/github
   ```
4. Generate a client secret, then:
   ```bash
   npx convex env set AUTH_GITHUB_ID <client-id>
   npx convex env set AUTH_GITHUB_SECRET <client-secret>
   ```

GitHub allows **one** callback URL per app, so dev and production need two
separate OAuth apps. Google accepts a list, so one app can cover both.

## Production

```bash
npx convex deploy --cmd 'npm run build'
```

Use that as the Vercel build command: it pushes `convex/` to the production
deployment, sets `NEXT_PUBLIC_CONVEX_URL` for the build, and then builds.

Everything from the local section repeats against the production deployment —
`npx @convex-dev/auth --prod` for the keys and `SITE_URL` (your real origin, no
trailing slash), `npx convex env set --prod` for the four OAuth secrets, and the
production callback URLs registered with Google and GitHub.

---

# QA checklist

Manual, because the flows are OAuth round-trips through two third parties —
automating them means real test accounts and stored credentials, which costs more
than it catches. Run this against a dev deployment before shipping auth changes.

| # | Step | Expected |
| --- | --- | --- |
| 1 | Load the app with `NEXT_PUBLIC_CONVEX_URL` unset | Board works, no account UI, no console errors |
| 2 | Load it configured, signed out | "Sign in" button in the header |
| 3 | Click it | Modal with "Continue with Google" and "Continue with GitHub" |
| 4 | Press Escape / click the backdrop | Modal closes, nothing signed in |
| 5 | Continue with Google, approve | Back on the board, avatar + name in the header, no `?code=` left in the URL |
| 6 | Reload the page | Still signed in |
| 7 | Open a new tab on the same origin | Still signed in (tokens are in localStorage) |
| 8 | Sign out | Back to the "Sign in" button; reload confirms it stuck |
| 9 | Continue with GitHub | Same as 5, avatar comes from GitHub |
| 10 | Sign in with Google, sign out, sign in with GitHub **on the same email** | One user, not two — check the `users` table in the dashboard |
| 11 | Build a board while signed out, then sign in | Board is untouched — it lives in localStorage, which sign-in does not clear |
| 12 | Break `AUTH_GOOGLE_SECRET`, retry sign-in | The provider's own error page, and the app is usable on return |
| 13 | Call `viewer` from the dashboard while signed out | Returns `null`, not an error |

Step 10 is the one that regresses quietly: Convex Auth links accounts on
**verified email**, so a provider that stops returning one silently creates
duplicate users.

# Troubleshooting

| Symptom | Cause |
| --- | --- |
| `redirect_uri_mismatch` | The provider's callback URL must be the `.convex.site` domain, not `.convex.cloud` and not your app's origin |
| Signs in, then immediately signs out | `SITE_URL` doesn't match the origin you loaded the app from — including port and `http` vs `https` |
| `Missing environment variable JWT_PRIVATE_KEY` | `npx @convex-dev/auth` wasn't run against this deployment |
| `?code=…` stays in the URL | `ConvexAuthProvider` isn't mounted on the page OAuth returns to — it lives in the root layout for exactly this reason |
| Header account UI never appears | The Convex deployment is unreachable; `viewer` stays `undefined`. Check `npx convex dev` is running |
