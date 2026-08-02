import Link from "next/link";
import Image from "next/image";
import { MapPin, ArrowRight, Phone, Star } from "lucide-react";
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
  avgRating?: number;
  reviewCount?: number;
  currencyCode?: string;
  profileHref?: string;
  actionLabel?: string;
  phone?: string;
  ratingSource?: "platform" | "google";
  avatarUrl?: string;
  searchTerms?: string[];
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

  const priceLabel = item.minPriceCents <= 0
    ? null
    : item.currencyCode && item.currencyCode !== "UAH"
      ? item.minPriceCents === item.maxPriceCents
        ? `від ${(item.minPriceCents / 100).toLocaleString("uk-UA", { style: "currency", currency: item.currencyCode })}`
        : `${(item.minPriceCents / 100).toLocaleString("uk-UA", { style: "currency", currency: item.currencyCode })}–${(item.maxPriceCents / 100).toLocaleString("uk-UA", { style: "currency", currency: item.currencyCode })}`
      :
    item.minPriceCents === item.maxPriceCents
      ? `від ${(item.minPriceCents / 100).toFixed(0)} грн`
      : `${(item.minPriceCents / 100).toFixed(0)}–${(item.maxPriceCents / 100).toFixed(0)} грн`;

  return (
    <Card className="card-hover">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-accent text-accent-foreground font-heading relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full text-base font-bold">
            {item.avatarUrl ? <Image src={item.avatarUrl} alt={item.displayName} fill sizes="48px" unoptimized className="object-cover" /> : initials}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-heading truncate font-bold">{item.displayName}</span>
              <span className="bg-accent text-accent-foreground shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold">
                {TYPE_LABELS[item.organizationType]}
              </span>
              {!!item.reviewCount && (
                <span className="flex shrink-0 items-center gap-0.5 text-xs font-semibold">
                  <Star className="fill-primary text-primary size-3" />
                  {item.avgRating!.toFixed(1)}
                  <span className="text-muted-foreground font-normal">({item.reviewCount})</span>
                  <span className={`ml-1 rounded px-1.5 py-0.5 text-[0.6rem] font-semibold ${item.ratingSource === "google" ? "bg-blue-500/10 text-blue-700 dark:text-blue-300" : "bg-primary/10 text-primary"}`}>{item.ratingSource === "google" ? "Google" : "EasyService"}</span>
                </span>
              )}
            </div>
            <p className="text-muted-foreground flex items-center gap-1 text-xs">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">
                {item.city}, {item.address}
              </span>
            </p>
            {item.phone && <a href={`tel:${item.phone.replace(/[^+\d]/g, "")}`} className="text-primary mt-1 flex items-center gap-1 text-xs hover:underline"><Phone className="size-3.5" />{item.phone}</a>}
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
          <span className="text-primary font-bold">{priceLabel ?? "Ціни уточнюються"}</span>
          <Button
            render={item.profileHref ? <a href={item.profileHref} target="_blank" rel="noreferrer" /> : <Link href={`/@${item.username}`} />}
            nativeButton={false}
            size="sm"
            className="group gap-1.5"
          >
            {item.actionLabel ?? "Переглянути слоти"}
            <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
