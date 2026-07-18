"use server";

import { redirect } from "next/navigation";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parsedPriceListSchema, type ParsedServiceItem } from "./schemas";

export type ParsePriceListResult =
  | { error: string }
  | { success: true; items: ParsedServiceItem[] };

const FALLBACK_CATEGORY_SLUG = "misc.other";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGES = 5;

async function requireStaffForImport() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const staff = await prisma.staff.findUnique({ where: { userId: session.user.id } });
  if (!staff) redirect("/register");

  return staff;
}

function buildSystemPrompt(categoryListForPrompt: string) {
  return `Ти розпізнаєш прайс-лист б'юті-майстра (текст або одне чи декілька фото) і перетворюєш його у структурований список послуг. Якщо фото декілька — обʼєднай усі позиції з усіх фото в один список, без дублікатів.

Для кожної позиції визнач:
- displayName: назва послуги українською
- price: число, гривні (без "грн")
- durationMinutes: ціле число, кратне 15; якщо тривалість не вказана — постав розумне типове значення для такої послуги
- categorySlug: обери НАЙБЛИЖЧИЙ slug зі списку нижче; якщо жоден явно не підходить — постав "${FALLBACK_CATEGORY_SLUG}"

Доступні категорії:
${categoryListForPrompt}

Поверни ЛИШЕ JSON у форматі {"items": [{"displayName": "...", "price": 800, "durationMinutes": 60, "categorySlug": "nails.manicure.gel"}]}. Якщо не вдалося розпізнати жодної послуги — поверни {"items": []}.`;
}

async function runPriceListExtraction(
  userContent: string | OpenAI.Chat.Completions.ChatCompletionContentPart[]
): Promise<ParsePriceListResult> {
  if (!process.env.OPENAI_API_KEY) {
    return { error: "AI-імпорт недоступний: не налаштовано OPENAI_API_KEY" };
  }

  const categories = await prisma.serviceCategory.findMany({
    where: { parentId: { not: null } },
    include: { parent: true },
  });
  const validSlugs = new Set(categories.map((c) => c.slug));
  const categoryListForPrompt = categories
    .map((c) => `${c.slug} — ${c.parent?.name} / ${c.name}`)
    .join("\n");

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  let content: string | null;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt(categoryListForPrompt) },
        { role: "user", content: userContent },
      ],
    });
    content = completion.choices[0]?.message?.content ?? null;
  } catch (error) {
    console.error("OpenAI price-list parse failed:", error);
    return { error: "Помилка при зверненні до AI. Спробуйте ще раз" };
  }

  if (!content) {
    return { error: "AI не повернув відповідь, спробуйте ще раз" };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(content);
  } catch {
    return { error: "Не вдалося розпізнати відповідь AI" };
  }

  const parsed = parsedPriceListSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return { error: "Не вдалося розпізнати відповідь AI" };
  }

  const items = parsed.data.items.map((item) => ({
    ...item,
    categorySlug: validSlugs.has(item.categorySlug) ? item.categorySlug : FALLBACK_CATEGORY_SLUG,
  }));

  if (items.length === 0) {
    return { error: "Не вдалося розпізнати жодної послуги" };
  }

  return { success: true, items };
}

export async function parsePriceList(rawText: string): Promise<ParsePriceListResult> {
  await requireStaffForImport();

  const text = rawText.trim();
  if (!text) {
    return { error: "Вставте текст прайсу" };
  }

  return runPriceListExtraction(text);
}

export async function parsePriceListFromImage(formData: FormData): Promise<ParsePriceListResult> {
  await requireStaffForImport();

  const files = formData.getAll("image").filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) {
    return { error: "Виберіть хоча б одне зображення" };
  }
  if (files.length > MAX_IMAGES) {
    return { error: `Максимум ${MAX_IMAGES} зображень за раз` };
  }
  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      return { error: "Усі файли мають бути зображеннями" };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { error: "Одне із зображень завелике (максимум 8 МБ)" };
    }
  }

  const imageParts: OpenAI.Chat.Completions.ChatCompletionContentPart[] = await Promise.all(
    files.map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
      return { type: "image_url" as const, image_url: { url: dataUrl } };
    })
  );

  return runPriceListExtraction([
    {
      type: "text",
      text:
        files.length > 1
          ? "Розпізнай прайс-лист на цих фото і обʼєднай усі позиції в один список."
          : "Розпізнай прайс-лист на цьому зображенні.",
    },
    ...imageParts,
  ]);
}
