import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Search as SearchIcon, MapPin } from "lucide-react";
import {
  getCatalogCombos,
  getCatalogListings,
  resolveCategoryFromSlug,
  resolveCityFromSlug,
} from "@/features/catalog/queries";
import { MasterListingCard } from "@/features/search/components/master-listing-card";
import { SITE_URL } from "@/lib/site-url";

export const revalidate = 3600;
// Allow request-time rendering of any city/category not prebuilt.
export const dynamicParams = true;

type CatalogPageParams = { city: string; category: string };

async function resolveParams(params: Promise<CatalogPageParams>) {
  const { city: citySlug, category: categorySlug } = await params;
  const [city, category] = await Promise.all([
    resolveCityFromSlug(citySlug),
    resolveCategoryFromSlug(categorySlug),
  ]);
  return { citySlug, categorySlug, city, category };
}

export async function generateStaticParams() {
  // Intentionally empty: on Railway the build runs BEFORE `prisma migrate
  // deploy` (which happens at start), so the DB is always one migration behind
  // and prerendering DB-backed pages here can hit columns that don't exist yet
  // (P2022). Catalog pages render on-demand and cache via `revalidate`, so a
  // crawler's first hit still gets full SSR HTML — no build-time DB dependency.
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<CatalogPageParams>;
}): Promise<Metadata> {
  const { citySlug, categorySlug, city, category } = await resolveParams(params);
  if (!city || !category) return {};

  const title = `${category.name} у місті ${city} — майстри та ціни | BlissTime`;
  const description = `Оберіть майстра послуги «${category.name}» у місті ${city}: ціни, відгуки, вільні слоти. Запис онлайн за 10 секунд, без дзвінків.`;
  const url = `${SITE_URL}/${citySlug}/${categorySlug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "BlissTime", locale: "uk_UA", type: "website" },
  };
}

export default async function CatalogPage({ params }: { params: Promise<CatalogPageParams> }) {
  const { citySlug, categorySlug, city, category } = await resolveParams(params);
  if (!city || !category) notFound();

  const [results, combos] = await Promise.all([
    getCatalogListings(city, [category.id, ...category.childIds]),
    getCatalogCombos(),
  ]);

  const relatedCategories = combos.filter((c) => c.citySlug === citySlug && c.categorySlug !== categorySlug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${category.name} у місті ${city}`,
    itemListElement: results.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "LocalBusiness",
        name: item.displayName,
        url: `${SITE_URL}/@${item.username}`,
        address: { "@type": "PostalAddress", addressLocality: item.city, streetAddress: item.address },
        ...(item.reviewCount
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: item.avgRating,
                reviewCount: item.reviewCount,
              },
            }
          : {}),
      },
    })),
  };

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="text-muted-foreground flex items-center gap-1.5 text-sm">
        <Link href="/" className="hover:text-foreground">
          Головна
        </Link>
        <span>/</span>
        <span className="text-foreground">{category.name}</span>
        <span>/</span>
        <span className="flex items-center gap-1 text-foreground">
          <MapPin className="size-3.5" />
          {city}
        </span>
      </nav>

      <div>
        <h1 className="font-heading text-3xl font-bold">
          {category.name} — {city}
        </h1>
        <p className="text-muted-foreground mt-1">
          {results.length > 0
            ? `Майстри послуги «${category.name}» у місті ${city}: ціни, відгуки, запис онлайн.`
            : `Поки що немає майстрів послуги «${category.name}» у місті ${city}.`}
        </p>
      </div>

      {results.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <div className="bg-accent text-accent-foreground flex size-12 items-center justify-center rounded-full">
            <SearchIcon className="size-6" />
          </div>
          <p className="font-medium">Ще не додано жодного майстра</p>
          <Link href="/search" className="text-primary text-sm underline underline-offset-4">
            Спробувати повний пошук з іншими фільтрами →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {results.map((item) => (
            <MasterListingCard key={item.staffId} item={item} />
          ))}
        </div>
      )}

      {relatedCategories.length > 0 && (
        <div className="border-t pt-6">
          <p className="text-muted-foreground mb-2 text-sm font-medium">
            Інші послуги в місті {city}
          </p>
          <div className="flex flex-wrap gap-2">
            {relatedCategories.map((c) => (
              <Link
                key={c.categorySlug}
                href={`/${c.citySlug}/${c.categorySlug}`}
                className="border-border hover:border-primary hover:text-primary rounded-full border px-3 py-1 text-sm transition-colors"
              >
                {c.categoryName}
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
