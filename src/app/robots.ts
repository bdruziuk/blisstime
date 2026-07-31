import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";
import { ALLOW_INDEXING } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  // Pre-launch: disallow everything and don't advertise the sitemap.
  if (!ALLOW_INDEXING) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/onboarding", "/login", "/register", "/api"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
