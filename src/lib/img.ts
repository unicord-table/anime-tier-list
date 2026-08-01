import type { SyntheticEvent } from "react";

/**
 * AniList's CDN only sends Access-Control-Allow-Origin when the request carries
 * one, and the browser's HTTP cache does not key on request mode — so a copy
 * cached by a plain (non-CORS) request has no ACAO header and every
 * `crossOrigin="anonymous"` <img> fails against it. A cache-busted URL is a
 * fresh cache entry, so one retry clears it. `fallback` covers the other case:
 * a size variant (extraLarge) the CDN doesn't actually have.
 */
export function retryCover(
  e: SyntheticEvent<HTMLImageElement>,
  fallback?: string,
) {
  const img = e.currentTarget;
  if (img.dataset.retried) return;
  img.dataset.retried = "1";
  const url = fallback || img.src;
  img.src = `${url}${url.includes("?") ? "&" : "?"}cb=1`;
}
