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
  district: z.string().trim().max(80).optional(),
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

// Public booking: one or more services, submitted as a comma-separated list.
export const bookingSchema = z.object({
  serviceIds: z
    .string()
    .transform((s) => s.split(",").map((id) => id.trim()).filter(Boolean))
    .pipe(z.array(z.string().min(1)).min(1, "Оберіть хоча б одну послугу")),
  slotStartISO: z.string().min(1, "Оберіть час"),
  clientName: z.string().trim().min(2, "Мінімум 2 символи"),
  clientPhone: z.string().trim().min(9, "Некоректний номер телефону"),
});
export type BookingInput = z.infer<typeof bookingSchema>;

// Admin-entered booking: a single service typed in by the master.
export const manualBookingSchema = z.object({
  serviceId: z.string().min(1, "Оберіть послугу"),
  slotStartISO: z.string().min(1, "Оберіть час"),
  clientName: z.string().trim().min(2, "Мінімум 2 символи"),
  clientPhone: z.string().trim().min(9, "Некоректний номер телефону"),
});
export type ManualBookingInput = z.infer<typeof manualBookingSchema>;

export const CONFIRMATION_MODES = ["MANUAL", "AUTO_ALL", "AUTO_TRUSTED"] as const;
export type ConfirmationModeValue = (typeof CONFIRMATION_MODES)[number];

export const CONFIRMATION_MODE_LABELS: Record<ConfirmationModeValue, string> = {
  MANUAL: "Підтверджувати кожен запис вручну",
  AUTO_ALL: "Підтверджувати всі записи автоматично",
  AUTO_TRUSTED: "Автоматично тільки для клієнтів з хорошим рейтингом надійності",
};

export const bookingSettingsSchema = z.object({
  confirmationMode: z.enum(CONFIRMATION_MODES),
  holdDurationMinutes: z.coerce.number().int().min(60).max(1440),
});
export type BookingSettingsInput = z.infer<typeof bookingSettingsSchema>;
