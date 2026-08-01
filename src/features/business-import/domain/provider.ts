import type {
  BusinessSearchPage,
  ImportCityCandidate,
  ImportedBusinessDetails,
  ResolvedImportCity,
  SearchBusinessesParams,
} from "./types";

export interface BusinessImportProvider {
  searchCities(query: string, countryCode?: string): Promise<ImportCityCandidate[]>;
  resolveCity(externalId: string): Promise<ResolvedImportCity>;
  searchBusinesses(params: SearchBusinessesParams): Promise<BusinessSearchPage>;
  getBusinessDetails(externalId: string): Promise<ImportedBusinessDetails>;
}
