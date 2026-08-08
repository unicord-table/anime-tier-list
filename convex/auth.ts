import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";

/**
 * Google and GitHub only. Both hand back a verified email, which is what
 * Convex Auth links accounts on — so signing in with GitHub and later with
 * Google on the same address lands on one user, not two.
 *
 * Neither provider needs a `scope`: the defaults (`openid email profile` /
 * `read:user user:email`) are exactly the name + avatar + email we store.
 */
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google, GitHub],
});
