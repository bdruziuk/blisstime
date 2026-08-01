import { notFound } from "next/navigation";
import SearchPage from "../../search/page";
import { resolveCityFromSlug } from "@/features/catalog/queries";

export default async function CityServicePage({ params, searchParams }: { params: Promise<{ city: string; segment: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const route = await params;
  const city = await resolveCityFromSlug(route.city);
  if (!city) notFound();
  return SearchPage({
    pathBased: true,
    searchParams: Promise.resolve({ ...await searchParams, city, category: route.segment === "all" ? undefined : route.segment }),
  });
}
