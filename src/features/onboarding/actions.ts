"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findNichePreset, defaultReminderTemplate } from "./niche-presets";

export type ActionState = { error: string } | { added: number } | undefined;

async function requireStaff() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const staff = await prisma.staff.findUnique({ where: { userId: session.user.id } });
  if (!staff) redirect("/register");
  return staff;
}

/**
 * Applies a niche preset: creates the preset's services (with category,
 * duration, suggested price) plus a ready reminder rule for each. Services
 * whose name the master already has are skipped, so re-applying (or mixing
 * presets) never duplicates.
 */
export async function applyNichePreset(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const staff = await requireStaff();

  const presetSlug = String(formData.get("presetSlug") || "");
  const preset = findNichePreset(presetSlug);
  if (!preset) {
    return { error: "Пресет не знайдено" };
  }

  const categorySlugs = [...new Set(preset.services.map((s) => s.categorySlug))];
  const categories = await prisma.serviceCategory.findMany({
    where: { slug: { in: categorySlugs } },
    select: { id: true, slug: true },
  });
  const categoryIdBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  const existing = await prisma.staffService.findMany({
    where: { staffId: staff.id },
    select: { displayName: true },
  });
  const existingNames = new Set(existing.map((s) => s.displayName.trim().toLowerCase()));

  const toCreate = preset.services.filter(
    (s) =>
      categoryIdBySlug.has(s.categorySlug) &&
      !existingNames.has(s.displayName.trim().toLowerCase())
  );

  for (const svc of toCreate) {
    await prisma.staffService.create({
      data: {
        staffId: staff.id,
        categoryId: categoryIdBySlug.get(svc.categorySlug)!,
        displayName: svc.displayName,
        durationMinutes: svc.durationMinutes,
        priceCents: svc.suggestedPriceCents,
        reminderRules: {
          create: {
            weeksAfterVisit: svc.reminderWeeks,
            messageTemplate: defaultReminderTemplate(svc.displayName, svc.reminderWeeks),
          },
        },
      },
    });
  }

  revalidatePath("/onboarding/services");
  revalidatePath("/dashboard/services");
  return { added: toCreate.length };
}
