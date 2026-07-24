import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewForm } from "@/features/booking/components/review-form";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { staff: true, service: true, review: true },
  });

  if (!booking) notFound();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden p-8">
      <div
        aria-hidden
        className="from-accent/60 via-background to-background pointer-events-none absolute inset-0 bg-gradient-to-b"
      />
      <Card className="relative w-full max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">
            Як пройшов візит до {booking.staff.displayName}?
          </CardTitle>
        </CardHeader>
        <CardContent>
          {booking.status !== "COMPLETED" ? (
            <p className="text-muted-foreground text-sm">
              Відгук можна залишити лише після завершеного візиту.
            </p>
          ) : booking.review ? (
            <p className="text-muted-foreground text-sm">
              Ви вже залишили відгук на цей запис. Дякуємо!
            </p>
          ) : (
            <ReviewForm bookingId={booking.id} />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
