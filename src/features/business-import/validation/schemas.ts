import { z } from "zod";
import { BEAUTY_IMPORT_CATEGORY_KEYS } from "../config/categories";

export const citySearchSchema = z.object({
  query: z.string().trim().min(2).max(100),
  countryCode: z.string().trim().length(2).toLowerCase().optional(),
});

export const createImportJobSchema = z.object({
  cityExternalId: z.string().trim().min(3).max(255),
  categories: z.array(z.enum(BEAUTY_IMPORT_CATEGORY_KEYS)).min(1).max(BEAUTY_IMPORT_CATEGORY_KEYS.length),
  includeDetails: z.boolean().default(true),
});

export const processImportJobSchema = z.object({
  limit: z.number().int().min(1).max(10).default(3),
});

export const importedBusinessStatusSchema = z.object({
  status: z.enum(["IMPORT_PENDING_REVIEW", "PUBLISHED", "REJECTED"]),
});
