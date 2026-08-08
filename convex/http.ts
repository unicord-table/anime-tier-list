import { httpRouter } from "convex/server";
import { auth } from "./auth";

/** Serves the JWKS and the /api/auth/signin|callback/* OAuth routes. */
const http = httpRouter();
auth.addHttpRoutes(http);

export default http;
