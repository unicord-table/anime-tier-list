# Auth

Sign-in with Google or GitHub, via [Convex Auth](https://labs.convex.dev/auth).
Everything below is setup you do **once per deployment** — none of it is checked
into the repo, and the app runs without any of it (see
[Running without Convex](#running-without-convex)).

## What's in the repo

| File | What it does |
| --- | --- |
| [`convex/auth.ts`](../convex/auth.ts) | The provider list — Google and GitHub |
| [`convex/auth.config.ts`](../convex/auth.config.ts) | Tells Convex to trust its own issued JWTs |
| [`convex/http.ts`](../convex/http.ts) | Mounts `/.well-known/jwks.json` and `/api/auth/*` |
| [`convex/schema.ts`](../convex/schema.ts) | `authTables` — `users`, `authSessions`, `authAccounts`, … |
| [`convex/users.ts`](../convex/users.ts) | `viewer` query: the signed-in user, or null |
| [`src/components/ConvexClientProvider.tsx`](../src/components/ConvexClientProvider.tsx) | The client + `ConvexAuthProvider`, mounted in the root layout |
| [`src/components/auth/AccountMenu.tsx`](../src/components/auth/AccountMenu.tsx) | Sign-in modal, avatar, sign-out — lives in `AppHeader` |

Profile data is not stored by this repo: `authTables.users` already holds
`name`, `image` and `email`, and `authAccounts` holds `provider` and
`providerAccountId`. `users.viewer` reads them back out.

## Environment variables

Two live in the **web app** (`.env.local`, written for you by `npx convex dev`):

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_CONVEX_URL` | `https://<name>.convex.cloud` — the only one the browser sees |
| `CONVEX_DEPLOYMENT` | Which deployment the CLI talks to. Never read by app code |

The rest live on the **Convex deployment**, set with `npx convex env set NAME value`
or from the dashboard. They are secrets and must never reach a `.env` file that
gets committed:

| Variable | Set by | Value |
| --- | --- | --- |
| `SITE_URL` | `npx @convex-dev/auth` | Where OAuth returns the user — `http://localhost:3000` in dev, your real origin in prod |
| `JWT_PRIVATE_KEY` | `npx @convex-dev/auth` | Signs session JWTs |
| `JWKS` | `npx @convex-dev/auth` | Public half of the above |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | you | Google OAuth client |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | you | GitHub OAuth app |

`CONVEX_SITE_URL` (`https://<name>.convex.site`, note `.site` not `.cloud`) is
injected by Convex — you never set it, but you need its value for the OAuth
redirect URIs below. `npx convex env list` prints it.

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

## Using auth in code

Client:

```tsx
const viewer = useQuery(api.users.viewer);   // undefined = loading, null = signed out
const { signIn, signOut } = useAuthActions();
signIn("google");   // or "github" — redirects the browser
```

Server. `getAuthUserId` returns null for an unauthenticated caller, so anything
that writes, or reads someone's private data, throws on it:

```ts
import { getAuthUserId } from "@convex-dev/auth/server";

export const saveBoard = mutation({
  args: { data: v.any() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not signed in");
    // …userId is the only thing that decides what this call may touch.
  },
});
```

Never take a user id from arguments — a client can send any string. `viewer` is
the exception to the throw: signed-out is a normal answer to "who am I", and the
UI branches on it.

There are no protected mutations yet, because nothing is stored server-side yet:
boards still live in localStorage. The guard above is the pattern to use when
Phase 2/3 puts them in Convex.

## Running without Convex

If `NEXT_PUBLIC_CONVEX_URL` is unset, `ConvexClientProvider` renders children
without a Convex client and `AccountMenu` renders nothing. `npm run dev`,
`npm run build` and the whole editor work exactly as before. Sign-in is additive,
not a prerequisite — a contributor fixing a drag-and-drop bug never has to set up
a Convex project.

## QA checklist

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

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| `redirect_uri_mismatch` | The provider's callback URL must be the `.convex.site` domain, not `.convex.cloud` and not your app's origin |
| Signs in, then immediately signs out | `SITE_URL` doesn't match the origin you loaded the app from — including port and `http` vs `https` |
| `Missing environment variable JWT_PRIVATE_KEY` | `npx @convex-dev/auth` wasn't run against this deployment |
| `?code=…` stays in the URL | `ConvexAuthProvider` isn't mounted on the page OAuth returns to — it lives in the root layout for exactly this reason |
| Header account UI never appears | The Convex deployment is unreachable; `viewer` stays `undefined`. Check `npx convex dev` is running |
