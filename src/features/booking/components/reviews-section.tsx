import { Star } from "lucide-react";
import type { StaffReview } from "@/features/booking/rating";

const dateFormatter = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} з 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={
            n <= rating ? "fill-primary text-primary size-4" : "text-muted-foreground/40 size-4"
          }
        />
      ))}
    </span>
  );
}

export function ReviewsSection({ reviews }: { reviews: StaffReview[] }) {
  if (reviews.length === 0) return null;

  return (
    <section id="reviews" className="scroll-mt-6">
      <h2 className="font-heading mb-4 text-xl font-bold">Відгуки</h2>
      <ul className="flex flex-col gap-4">
        {reviews.map((review) => (
          <li key={review.id} className="border-border rounded-xl border p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Stars rating={review.rating} />
                <span className="text-sm font-semibold">{review.clientName ?? "Клієнт"}</span>
              </div>
              <time className="text-muted-foreground text-xs" dateTime={review.createdAt.toISOString()}>
                {dateFormatter.format(review.createdAt)}
              </time>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">{review.serviceName}</p>
            {review.comment && <p className="mt-2 text-sm">{review.comment}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
