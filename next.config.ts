import type { NextConfig } from "next";

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
};

export default nextConfig;
