import OpenAI from "openai";
import { z } from "zod";

const resultSchema = z.object({ items: z.array(z.object({
  displayName: z.string().trim().min(2).max(160),
  priceAmount: z.number().positive(),
  currencyCode: z.string().trim().length(3),
  durationMinutes: z.number().int().positive().nullable().optional(),
  categorySlug: z.string().trim().max(100).nullable().optional(),
  sourceUrl: z.string().url(),
})).max(250) });

export type ExtractedService = z.infer<typeof resultSchema>["items"][number];

export async function extractServicesFromWebsite(text: string, sourceUrls: string[]): Promise<ExtractedService[]> {
  if (!process.env.OPENAI_API_KEY) throw new Error("Не налаштовано OPENAI_API_KEY");
  const completion = await new OpenAI({ apiKey: process.env.OPENAI_API_KEY }).chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: `Extract only explicitly stated beauty services with explicit prices from website text. Never invent prices or durations. Use ISO 4217 currency codes; infer currency from an explicit symbol and business context only. Keep the original service language. sourceUrl must be one of: ${sourceUrls.join(", ")}. Return JSON {"items":[{"displayName":"...","priceAmount":12.5,"currencyCode":"EUR","durationMinutes":null,"categorySlug":null,"sourceUrl":"..."}]}. If uncertain return {"items":[]}.` },
      { role: "user", content: text },
    ],
  });
  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("AI не повернув результат");
  const parsed = resultSchema.parse(JSON.parse(raw));
  const allowed = new Set(sourceUrls);
  return parsed.items.filter((item) => allowed.has(item.sourceUrl));
}
