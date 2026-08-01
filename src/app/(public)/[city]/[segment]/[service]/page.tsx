import { notFound } from "next/navigation";
import SearchPage from "../../../search/page";
import { resolveCityFromSlug } from "@/features/catalog/queries";

export default async function KyivDistrictServicePage({ params, searchParams }: { params: Promise<{ city: string; segment: string; service: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const route = await params;
  const city = await resolveCityFromSlug(route.city);
  if (city !== "Київ") notFound();
  return SearchPage({
    pathBased: true,
    searchParams: Promise.resolve({
      ...await searchParams,
      city,
      district: route.segment === "all" ? undefined : route.segment,
      category: route.service === "all" ? undefined : route.service,
    }),
  });
}
