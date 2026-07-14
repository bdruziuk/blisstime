import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Мінімум 2 символи"),
  email: z.string().trim().email("Некоректний email"),
  password: z.string().min(8, "Мінімум 8 символів"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const profileSchema = z.object({
  displayName: z.string().trim().min(2, "Мінімум 2 символи"),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]{3,30}$/, "3-30 символів: латиниця, цифри, дефіс"),
  bio: z.string().trim().max(500).optional(),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const serviceSchema = z.object({
  categoryId: z.string().min(1, "Оберіть категорію"),
  displayName: z.string().trim().min(2, "Мінімум 2 символи"),
  // Entered by the user in UAH; converted to priceCents before saving.
  price: z.coerce.number().positive("Ціна має бути більшою за 0"),
  durationMinutes: z.coerce
    .number()
    .int()
    .positive()
    .multipleOf(15, "Крок тривалості — 15 хв"),
});
export type ServiceInput = z.infer<typeof serviceSchema>;

export const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Day = (typeof DAYS)[number];

export const DAY_LABELS: Record<Day, string> = {
  mon: "Понеділок",
  tue: "Вівторок",
  wed: "Середа",
  thu: "Четвер",
  fri: "П'ятниця",
  sat: "Субота",
  sun: "Неділя",
};

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const locationSchema = z.object({
  address: z.string().trim().min(3, "Вкажіть адресу"),
  city: z.string().trim().min(2, "Вкажіть місто"),
  hours: z.record(
    z.enum(DAYS),
    z.object({
      open: z.boolean(),
      from: z.string().regex(timeRegex),
      to: z.string().regex(timeRegex),
    })
  ),
});
export type LocationInput = z.infer<typeof locationSchema>;
