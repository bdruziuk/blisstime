import SearchPage from "../../../search/page";
import { notFound } from "next/navigation";
import { resolveCityFromSlug } from "@/features/catalog/queries";

type RouteParams = { city: string; district: string; service: string };
type QueryParams = { type?: string; minPrice?: string; maxPrice?: string; minRating?: string; sort?: string };

export default async function CatalogSearchPage({ params, searchParams }: { params: Promise<RouteParams>; searchParams: Promise<QueryParams> }) {
  const route = await params;
  const query = await searchParams;
  const city = await resolveCityFromSlug(route.city);
  if (!city || city !== "Київ") notFound();
  return SearchPage({
    pathBased: true,
    searchParams: Promise.resolve({
      ...query,
      city,
      district: route.district === "all" ? undefined : route.district,
      category: route.service === "all" ? undefined : decodeURIComponent(route.service),
    }),
  });
}
