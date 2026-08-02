import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getCatalogCombos } from "@/features/catalog/queries";
import { SITE_URL } from "@/lib/site-url";

// Regenerate at runtime (hourly) rather than freezing at build time, when the
// production DB isn't migrated yet.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticUrls: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/search`, changeFrequency: "daily", priority: 0.8 },
  ];

  try {
    const [combos, masters] = await Promise.all([
      getCatalogCombos(),
      prisma.staff.findMany({
        where: { onboardedAt: { not: null }, isPublished: true },
        select: { username: true, updatedAt: true },
      }),
    ]);

    return [
      ...staticUrls,
      ...combos.map((c) => ({
        url: `${SITE_URL}/${c.citySlug}/${c.categorySlug}`,
        changeFrequency: "daily" as const,
        priority: 0.7,
      })),
      ...masters.map((m) => ({
        url: `${SITE_URL}/@${m.username}`,
        lastModified: m.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    // DB not ready at build time — ship the static core; runtime revalidate fills the rest.
    return staticUrls;
  }
}
