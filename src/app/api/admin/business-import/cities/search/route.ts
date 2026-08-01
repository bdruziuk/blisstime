import { NextResponse } from "next/server";
import { getSuperAdminUser } from "@/features/business-import/admin-auth";
import { apiError, unauthorized } from "@/features/business-import/api-response";
import { googlePlacesProvider } from "@/features/business-import/providers/google-places";
import { allowCitySearch } from "@/features/business-import/rate-limit";
import { citySearchSchema } from "@/features/business-import/validation/schemas";

export async function GET(request: Request) {
  const admin = await getSuperAdminUser();
  if (!admin) return unauthorized();
  if (!allowCitySearch(admin.id)) {
    return NextResponse.json({ error: "Забагато запитів. Спробуйте за хвилину." }, { status: 429 });
  }
  try {
    const url = new URL(request.url);
    const input = citySearchSchema.parse({
      query: url.searchParams.get("query"),
      countryCode: url.searchParams.get("countryCode") || undefined,
    });
    return NextResponse.json({ cities: await googlePlacesProvider.searchCities(input.query, input.countryCode) });
  } catch (error) {
    return apiError(error);
  }
}
