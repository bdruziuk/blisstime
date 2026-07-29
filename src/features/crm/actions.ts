"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type NoteState = { error: string } | { saved: true } | undefined;

async function requireStaff() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const staff = await prisma.staff.findUnique({ where: { userId: session.user.id } });
  if (!staff) redirect("/register");
  return staff;
}

/** Upserts this master's private note about a client. Only for clients who
 * actually booked with this master. */
export async function saveClientNote(
  _prevState: NoteState,
  formData: FormData
): Promise<NoteState> {
  const staff = await requireStaff();
  const clientId = String(formData.get("clientId") || "");
  const body = String(formData.get("body") || "").trim();

  const hasBooking = await prisma.booking.findFirst({
    where: { staffId: staff.id, clientId },
    select: { id: true },
  });
  if (!hasBooking) return { error: "Клієнта не знайдено" };

  if (body.length === 0) {
    await prisma.clientNote.deleteMany({ where: { staffId: staff.id, clientId } });
  } else {
    await prisma.clientNote.upsert({
      where: { staffId_clientId: { staffId: staff.id, clientId } },
      update: { body },
      create: { staffId: staff.id, clientId, body },
    });
  }

  revalidatePath(`/dashboard/clients/${clientId}`);
  return { saved: true };
}
