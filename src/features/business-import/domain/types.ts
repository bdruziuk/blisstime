export type GeoBounds = { south: number; west: number; north: number; east: number };
export type ImportArea = { bounds: GeoBounds; depth: number };

export type ImportCityCandidate = {
  externalId: string;
  name: string;
  formattedName: string;
};

export type ResolvedImportCity = ImportCityCandidate & {
  provider: "GOOGLE";
  countryCode: string;
  centerLat: number;
  centerLng: number;
  bounds: GeoBounds;
};

export type ImportedBusinessSummary = {
  externalId: string;
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  primaryType: string | null;
  types: string[];
};

export type ImportedBusinessDetails = ImportedBusinessSummary & {
  addressComponents: Array<{ longText: string; shortText: string; types: string[] }>;
  nationalPhone: string | null;
  internationalPhone: string | null;
  websiteUri: string | null;
  googleMapsUri: string | null;
  rating: number | null;
  userRatingCount: number | null;
  regularOpeningHours: unknown | null;
  businessStatus: string | null;
  fetchedAt: Date;
};

export type SearchBusinessesParams = {
  query: string;
  bounds: GeoBounds;
  pageToken?: string;
  languageCode?: string;
  regionCode?: string;
};

export type BusinessSearchPage = {
  businesses: ImportedBusinessSummary[];
  nextPageToken?: string;
};
