"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { auth, signIn } from "@/lib/auth";
import {
  registerSchema,
  profileSchema,
  serviceSchema,
  locationSchema,
} from "./schemas";

export type ActionState = { error: string } | undefined;

function slugifyUsername(base: string) {
  const cleaned = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 20);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${cleaned || "master"}-${suffix}`;
}

async function requireStaff() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const staff = await prisma.staff.findUnique({
    where: { userId: session.user.id },
  });
  if (!staff) redirect("/register");

  return staff;
}

export async function registerStaff(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Цей email вже зареєстровано" };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const username = slugifyUsername(email.split("@")[0]);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name, email, passwordHash },
    });
    const organization = await tx.organization.create({
      data: { type: "SOLO", name },
    });
    const location = await tx.location.create({
      data: {
        organizationId: organization.id,
        address: "",
        city: "",
        workingHours: {},
      },
    });
    await tx.staff.create({
      data: {
        userId: user.id,
        locationId: location.id,
        username,
        displayName: name,
      },
    });
  });

  await signIn("credentials", {
    email,
    password,
    redirectTo: "/onboarding/profile",
  });
}

export async function loginStaff(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Невірний email або пароль" };
    }
    throw error;
  }
}

export async function updateProfile(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const staff = await requireStaff();

  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName"),
    username: formData.get("username"),
    bio: formData.get("bio") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { displayName, username, bio } = parsed.data;

  const usernameTaken = await prisma.staff.findFirst({
    where: { username, NOT: { id: staff.id } },
  });
  if (usernameTaken) {
    return { error: "Це ім'я користувача вже зайняте" };
  }

  await prisma.staff.update({
    where: { id: staff.id },
    data: { displayName, username, bio: bio ?? null },
  });

  redirect("/onboarding/services");
}

export async function addService(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const staff = await requireStaff();

  const parsed = serviceSchema.safeParse({
    categoryId: formData.get("categoryId"),
    displayName: formData.get("displayName"),
    price: formData.get("price"),
    durationMinutes: formData.get("durationMinutes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { categoryId, displayName, price, durationMinutes } = parsed.data;

  await prisma.staffService.create({
    data: {
      staffId: staff.id,
      categoryId,
      displayName,
      durationMinutes,
      priceCents: Math.round(price * 100),
    },
  });

  revalidatePath("/onboarding/services");
}

export async function removeService(serviceId: string) {
  const staff = await requireStaff();

  await prisma.staffService.deleteMany({
    where: { id: serviceId, staffId: staff.id },
  });

  revalidatePath("/onboarding/services");
}

export async function goToHoursStep() {
  await requireStaff();
  redirect("/onboarding/hours");
}

export async function saveLocationAndFinish(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const staff = await requireStaff();

  const hours = Object.fromEntries(
    (["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const).map((day) => [
      day,
      {
        open: formData.get(`${day}_open`) === "on",
        from: String(formData.get(`${day}_from`) || "09:00"),
        to: String(formData.get(`${day}_to`) || "18:00"),
      },
    ])
  );

  const parsed = locationSchema.safeParse({
    address: formData.get("address"),
    city: formData.get("city"),
    hours,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { address, city } = parsed.data;

  await prisma.$transaction(async (tx) => {
    const fullStaff = await tx.staff.findUniqueOrThrow({
      where: { id: staff.id },
    });
    await tx.location.update({
      where: { id: fullStaff.locationId },
      data: { address, city, workingHours: parsed.data.hours },
    });
    await tx.staff.update({
      where: { id: staff.id },
      data: { onboardedAt: new Date() },
    });
  });

  redirect("/dashboard");
}
