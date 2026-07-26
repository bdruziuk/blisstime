// Curated onboarding presets. Picking a niche pre-fills a set of typical
// services (category, duration, suggested price) plus ready reminder rules,
// so a master's cabinet is usable in seconds. Everything is editable
// afterwards — presets are just a starting point.
//
// Kept as static config (not a DB table): these are curated by us, not
// user-editable, and reference the seeded category taxonomy by slug —
// resolved to ids when applied, exactly like the AI-import mapping.

export type NichePresetService = {
  /** Slug from the seeded ServiceCategory taxonomy (see prisma/seed.ts). */
  categorySlug: string;
  displayName: string;
  durationMinutes: number;
  suggestedPriceCents: number;
  /** Weeks after the visit to nudge the client (for the future Камбекер). */
  reminderWeeks: number;
};

export type NichePreset = {
  slug: string;
  name: string;
  emoji: string;
  description: string;
  services: NichePresetService[];
};

/** Reminder text stored on each preset-created ReminderRule. Placeholders
 * ({service}, {weeks}, {link}) are resolved later by the Камбекер engine. */
export function defaultReminderTemplate(displayName: string, weeks: number): string {
  return `Вітаємо! Минуло ${weeks} тиж. — час оновити «${displayName}». Записатися: {link}`;
}

export const NICHE_PRESETS: NichePreset[] = [
  {
    slug: "nails",
    name: "Манікюр та педикюр",
    emoji: "💅",
    description: "Манікюр, гель-лак, педикюр",
    services: [
      { categorySlug: "nails.manicure.classic", displayName: "Манікюр класичний", durationMinutes: 60, suggestedPriceCents: 35000, reminderWeeks: 3 },
      { categorySlug: "nails.manicure.gel", displayName: "Манікюр з гель-лаком", durationMinutes: 90, suggestedPriceCents: 50000, reminderWeeks: 3 },
      { categorySlug: "nails.pedicure", displayName: "Педикюр", durationMinutes: 90, suggestedPriceCents: 60000, reminderWeeks: 4 },
    ],
  },
  {
    slug: "brows_lashes",
    name: "Брови та вії",
    emoji: "👁️",
    description: "Корекція, ламінування, нарощування",
    services: [
      { categorySlug: "brows.correction", displayName: "Корекція та фарбування брів", durationMinutes: 45, suggestedPriceCents: 30000, reminderWeeks: 3 },
      { categorySlug: "brows.lamination", displayName: "Ламінування брів", durationMinutes: 60, suggestedPriceCents: 50000, reminderWeeks: 5 },
      { categorySlug: "lashes.extension.classic", displayName: "Нарощування вій (класика)", durationMinutes: 120, suggestedPriceCents: 60000, reminderWeeks: 3 },
      { categorySlug: "lashes.extension.volume", displayName: "Нарощування вій (об'єм)", durationMinutes: 150, suggestedPriceCents: 80000, reminderWeeks: 3 },
    ],
  },
  {
    slug: "hair",
    name: "Волосся",
    emoji: "💇‍♀️",
    description: "Стрижки, фарбування, догляд",
    services: [
      { categorySlug: "hair.haircut", displayName: "Жіноча стрижка", durationMinutes: 60, suggestedPriceCents: 40000, reminderWeeks: 6 },
      { categorySlug: "hair.coloring", displayName: "Фарбування", durationMinutes: 180, suggestedPriceCents: 120000, reminderWeeks: 6 },
    ],
  },
  {
    slug: "cosmetology",
    name: "Косметологія",
    emoji: "✨",
    description: "Чистка та догляд за обличчям",
    services: [
      { categorySlug: "cosmetology.facial", displayName: "Чистка обличчя", durationMinutes: 90, suggestedPriceCents: 80000, reminderWeeks: 4 },
    ],
  },
  {
    slug: "massage",
    name: "Масаж",
    emoji: "💆‍♀️",
    description: "Розслаблюючий та лікувальний масаж",
    services: [
      { categorySlug: "massage.relax", displayName: "Розслаблюючий масаж", durationMinutes: 60, suggestedPriceCents: 60000, reminderWeeks: 2 },
    ],
  },
  {
    slug: "tattoo_pm",
    name: "Перманентний макіяж",
    emoji: "🖋️",
    description: "Татуаж брів, губ, повік",
    services: [
      { categorySlug: "tattoo.permanent_brows", displayName: "Перманентний макіяж брів", durationMinutes: 120, suggestedPriceCents: 250000, reminderWeeks: 4 },
    ],
  },
];

export function findNichePreset(slug: string): NichePreset | undefined {
  return NICHE_PRESETS.find((p) => p.slug === slug);
}
