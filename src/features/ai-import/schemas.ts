import { z } from "zod";

export const parsedServiceItemSchema = z.object({
  displayName: z.string().trim().min(1),
  categorySlug: z.string().trim().min(1),
  price: z.number().positive(),
  durationMinutes: z.number().int().positive(),
});
export type ParsedServiceItem = z.infer<typeof parsedServiceItemSchema>;

export const parsedPriceListSchema = z.object({
  items: z.array(parsedServiceItemSchema),
});
