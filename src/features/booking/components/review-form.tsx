"use client";

import { useActionState, useState } from "react";
import { Star, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { submitReview, type SubmitReviewResult } from "@/features/booking/review-actions";

export function ReviewForm({ bookingId }: { bookingId: string }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [state, formAction, pending] = useActionState<SubmitReviewResult | undefined, FormData>(
    submitReview,
    undefined
  );

  if (state && "success" in state) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="bg-accent text-primary flex size-14 items-center justify-center rounded-full">
          <CheckCircle2 className="size-7" />
        </div>
        <p className="text-lg font-bold">Дякуємо за відгук!</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="rating" value={rating} />

      <div className="flex flex-col gap-1.5">
        <Label>Ваша оцінка</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              aria-label={`${n} з 5`}
              className="p-0.5"
            >
              <Star
                className={`size-8 ${
                  n <= (hovered || rating)
                    ? "fill-primary text-primary"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="comment">Коментар (необов&apos;язково)</Label>
        <textarea
          id="comment"
          name="comment"
          rows={4}
          placeholder="Розкажіть, як пройшов візит..."
          className="border-input w-full rounded-md border bg-transparent p-2 text-sm shadow-xs"
        />
      </div>

      {state && "error" in state && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending || rating === 0}>
        {pending ? "Надсилаємо..." : "Залишити відгук"}
      </Button>
    </form>
  );
}
