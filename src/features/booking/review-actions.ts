"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type SubmitReviewResult = { error: string } | { success: true };

export async function submitReview(
  _prevState: SubmitReviewResult | undefined,
  formData: FormData
): Promise<SubmitReviewResult> {
  const bookingId = String(formData.get("bookingId") || "");
  const ratingRaw = String(formData.get("rating") || "");
  const comment = String(formData.get("comment") || "").trim() || null;

  const rating = Number(ratingRaw);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Оберіть оцінку від 1 до 5" };
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { review: true },
  });
  if (!booking || booking.status !== "COMPLETED") {
    return { error: "Відгук можна залишити лише для завершеного візиту" };
  }
  if (booking.review) {
    return { error: "Ви вже залишили відгук на цей запис" };
  }

  await prisma.review.create({
    data: { bookingId: booking.id, rating, comment },
  });

  revalidatePath(`/review/${bookingId}`);
  return { success: true };
}
