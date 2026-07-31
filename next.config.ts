import type { NextConfig } from "next";

// Mirrors src/lib/seo.ts — next.config can't import from src.
const allowIndexing = process.env.ALLOW_INDEXING === "true";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Folder names starting with "@" are reserved for parallel routes in
      // the App Router, so /@username is rewritten to an internal segment.
      {
        source: "/@:username",
        destination: "/master/:username",
      },
    ];
  },
  async headers() {
    // Pre-launch: one header covers every route (including sitemap.xml and
    // anything without an HTML <head>), independent of metadata merging.
    if (allowIndexing) return [];
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
