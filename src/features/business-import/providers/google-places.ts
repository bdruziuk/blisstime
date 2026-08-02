import type { BusinessImportProvider } from "../domain/provider";
import type {
  BusinessSearchPage,
  ImportCityCandidate,
  ImportedBusinessDetails,
  ImportedBusinessSummary,
  ResolvedImportCity,
  SearchBusinessesParams,
} from "../domain/types";
import { IMPORT_CONFIG } from "../config/import-config";
import { isValidBounds } from "../services/grid-builder";
import { withRetry } from "../services/retry";
import { nearestRegionalCenter, regionalCenterFromRegion } from "@/features/search/regional-centers";

const API_BASE = "https://places.googleapis.com/v1";

type GoogleText = { text?: string; languageCode?: string };
type GoogleLatLng = { latitude?: number; longitude?: number };
type GoogleAddressComponent = { longText?: string; shortText?: string; types?: string[] };
type GooglePlace = {
  id?: string;
  displayName?: GoogleText;
  formattedAddress?: string;
  addressComponents?: GoogleAddressComponent[];
  location?: GoogleLatLng;
  viewport?: { low?: GoogleLatLng; high?: GoogleLatLng };
  primaryType?: string;
  types?: string[];
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  regularOpeningHours?: unknown;
  businessStatus?: string;
};

export class GooglePlacesError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly retryable: boolean
  ) {
    super(message);
    this.name = "GooglePlacesError";
  }
}

function friendlyGoogleError(status: number, body: string): GooglePlacesError {
  const normalized = body.toLowerCase();
  if (status === 401 || status === 403) {
    if (normalized.includes("billing")) return new GooglePlacesError("Для Google Places не увімкнено billing", status, false);
    return new GooglePlacesError("Google Places API key недійсний або не має доступу", status, false);
  }
  if (status === 429 || normalized.includes("resource_exhausted")) {
    return new GooglePlacesError("Перевищено квоту або rate limit Google Places", status, true);
  }
  if (status >= 500) return new GooglePlacesError("Google Places тимчасово недоступний", status, true);
  return new GooglePlacesError("Google Places відхилив запит", status, false);
}

function requiredApiKey(): string {
  const key = process.env.GOOGLE_PLACES_SERVER_API_KEY?.trim();
  if (!key) throw new GooglePlacesError("Не налаштовано GOOGLE_PLACES_SERVER_API_KEY", 500, false);
  return key;
}

async function googleRequest<T>(
  path: string,
  options: { method?: "GET" | "POST"; body?: unknown; fieldMask: string }
): Promise<T> {
  return withRetry(
    async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);
      try {
        const response = await fetch(`${API_BASE}${path}`, {
          method: options.method ?? "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": requiredApiKey(),
            "X-Goog-FieldMask": options.fieldMask,
          },
          body: options.body === undefined ? undefined : JSON.stringify(options.body),
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw friendlyGoogleError(response.status, await response.text());
        return (await response.json()) as T;
      } catch (error) {
        if (error instanceof GooglePlacesError) throw error;
        if (error instanceof Error && error.name === "AbortError") {
          throw new GooglePlacesError("Google Places не відповів вчасно", 504, true);
        }
        throw new GooglePlacesError("Не вдалося з'єднатися з Google Places", 502, true);
      } finally {
        clearTimeout(timeout);
      }
    },
    {
      maxAttempts: IMPORT_CONFIG.maxAttempts,
      baseDelayMs: IMPORT_CONFIG.retryBaseDelayMs,
      shouldRetry: (error) => error instanceof GooglePlacesError && error.retryable,
    }
  );
}

function toSummary(place: GooglePlace): ImportedBusinessSummary | null {
  const externalId = place.id;
  const name = place.displayName?.text;
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;
  if (!externalId || !name || lat === undefined || lng === undefined) return null;
  return {
    externalId,
    name,
    formattedAddress: place.formattedAddress ?? "",
    lat,
    lng,
    primaryType: place.primaryType ?? null,
    types: place.types ?? [],
  };
}

export class GooglePlacesImportProvider implements BusinessImportProvider {
  async searchCities(query: string, countryCode?: string): Promise<ImportCityCandidate[]> {
    const response = await googleRequest<{
      suggestions?: Array<{
        placePrediction?: { placeId?: string; text?: GoogleText; structuredFormat?: { mainText?: GoogleText } };
      }>;
    }>("/places:autocomplete", {
      body: {
        input: query,
        includedPrimaryTypes: ["(cities)"],
        ...(countryCode ? { includedRegionCodes: [countryCode.toLowerCase()] } : {}),
        languageCode: "uk",
      },
      fieldMask:
        "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat.mainText",
    });
    return (response.suggestions ?? []).flatMap((suggestion) => {
      const prediction = suggestion.placePrediction;
      if (!prediction?.placeId || !prediction.text?.text) return [];
      return [
        {
          externalId: prediction.placeId,
          name: prediction.structuredFormat?.mainText?.text ?? prediction.text.text,
          formattedName: prediction.text.text,
        },
      ];
    });
  }

  async resolveCity(externalId: string): Promise<ResolvedImportCity> {
    const place = await googleRequest<GooglePlace>(`/places/${encodeURIComponent(externalId)}?languageCode=uk`, {
      method: "GET",
      fieldMask: "id,displayName,formattedAddress,addressComponents,location,viewport",
    });
    const low = place.viewport?.low;
    const high = place.viewport?.high;
    const bounds = {
      south: low?.latitude ?? Number.NaN,
      west: low?.longitude ?? Number.NaN,
      north: high?.latitude ?? Number.NaN,
      east: high?.longitude ?? Number.NaN,
    };
    if (!place.id || !place.displayName?.text || !place.location || !isValidBounds(bounds)) {
      throw new GooglePlacesError("Місто не знайдено або Google не повернув viewport", 422, false);
    }
    const country = place.addressComponents?.find((component) => component.types?.includes("country"));
    const region = place.addressComponents?.find((component) => component.types?.includes("administrative_area_level_1"));
    const localizedCity = place.addressComponents?.find((component) =>
      component.types?.some((type) => ["locality", "postal_town", "administrative_area_level_3"].includes(type))
    )?.longText ?? place.displayName.text;
    return {
      provider: "GOOGLE",
      externalId: place.id,
      name: localizedCity,
      formattedName: place.formattedAddress ?? place.displayName.text,
      countryCode: country?.shortText?.toUpperCase() ?? "XX",
      regionalCenter: regionalCenterFromRegion(region?.longText) ?? nearestRegionalCenter(place.location.latitude ?? 0, place.location.longitude ?? 0),
      centerLat: place.location.latitude ?? (bounds.south + bounds.north) / 2,
      centerLng: place.location.longitude ?? (bounds.west + bounds.east) / 2,
      bounds,
    };
  }

  async searchBusinesses(params: SearchBusinessesParams): Promise<BusinessSearchPage> {
    const response = await googleRequest<{ places?: GooglePlace[]; nextPageToken?: string }>(
      "/places:searchText",
      {
        body: {
          textQuery: params.query,
          pageSize: 20,
          ...(params.pageToken ? { pageToken: params.pageToken } : {}),
          locationRestriction: {
            rectangle: {
              low: { latitude: params.bounds.south, longitude: params.bounds.west },
              high: { latitude: params.bounds.north, longitude: params.bounds.east },
            },
          },
          languageCode: params.languageCode ?? "uk",
          ...(params.regionCode ? { regionCode: params.regionCode.toLowerCase() } : {}),
        },
        fieldMask:
          "places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.types,nextPageToken",
      }
    );
    return {
      businesses: (response.places ?? []).flatMap((place) => {
        const summary = toSummary(place);
        return summary ? [summary] : [];
      }),
      nextPageToken: response.nextPageToken,
    };
  }

  async getBusinessDetails(externalId: string): Promise<ImportedBusinessDetails> {
    const place = await googleRequest<GooglePlace>(`/places/${encodeURIComponent(externalId)}?languageCode=uk`, {
      method: "GET",
      fieldMask:
        "id,displayName,formattedAddress,addressComponents,location,primaryType,types,nationalPhoneNumber,internationalPhoneNumber,websiteUri,googleMapsUri,rating,userRatingCount,regularOpeningHours,businessStatus",
    });
    const summary = toSummary(place);
    if (!summary) throw new GooglePlacesError("Google повернув неповні дані закладу", 422, false);
    return {
      ...summary,
      addressComponents: (place.addressComponents ?? []).map((component) => ({
        longText: component.longText ?? "",
        shortText: component.shortText ?? "",
        types: component.types ?? [],
      })),
      nationalPhone: place.nationalPhoneNumber ?? null,
      internationalPhone: place.internationalPhoneNumber ?? null,
      websiteUri: place.websiteUri ?? null,
      googleMapsUri: place.googleMapsUri ?? null,
      rating: place.rating ?? null,
      userRatingCount: place.userRatingCount ?? null,
      regularOpeningHours: place.regularOpeningHours ?? null,
      businessStatus: place.businessStatus ?? null,
      fetchedAt: new Date(),
    };
  }
}

export const googlePlacesProvider = new GooglePlacesImportProvider();
