/**
 * Search-engine indexing switch. Blocked by default so a staging/preview
 * deploy can never leak into search; set ALLOW_INDEXING="true" in the
 * production environment at launch to open the site up.
 *
 * robots.txt and statically prerendered pages bake this in at build time, so
 * changing the value takes effect on the next deploy (Railway redeploys on an
 * env change anyway).
 */
export const ALLOW_INDEXING = process.env.ALLOW_INDEXING === "true";
