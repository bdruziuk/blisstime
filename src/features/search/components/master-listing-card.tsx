import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type MasterListingItem = {
  username: string;
  displayName: string;
  bio: string | null;
  city: string;
  address: string;
  organizationType: "SOLO" | "SALON" | "BRAND";
  categoryNames: string[];
  minPriceCents: number;
  maxPriceCents: number;
};

const TYPE_LABELS: Record<MasterListingItem["organizationType"], string> = {
  SOLO: "Окремий майстер",
  SALON: "Салон",
  BRAND: "Салон",
};

export function MasterListingCard({ item }: { item: MasterListingItem }) {
  const initials = item.displayName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const priceLabel =
    item.minPriceCents === item.maxPriceCents
      ? `від ${(item.minPriceCents / 100).toFixed(0)} грн`
      : `${(item.minPriceCents / 100).toFixed(0)}–${(item.maxPriceCents / 100).toFixed(0)} грн`;

  return (
    <Card className="card-hover">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-accent text-accent-foreground font-heading flex size-12 shrink-0 items-center justify-center rounded-full text-base font-bold">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-heading truncate font-bold">{item.displayName}</span>
              <span className="bg-accent text-accent-foreground shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold">
                {TYPE_LABELS[item.organizationType]}
              </span>
            </div>
            <p className="text-muted-foreground flex items-center gap-1 text-xs">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">
                {item.city}, {item.address}
              </span>
            </p>
          </div>
        </div>

        {item.bio && <p className="text-muted-foreground line-clamp-2 text-sm">{item.bio}</p>}

        {item.categoryNames.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.categoryNames.map((name) => (
              <span
                key={name}
                className="border-border rounded-full border px-2 py-0.5 text-xs"
              >
                {name}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-primary font-bold">{priceLabel}</span>
          <Button
            render={<Link href={`/@${item.username}`} />}
            nativeButton={false}
            size="sm"
            className="group gap-1.5"
          >
            Переглянути слоти
            <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
