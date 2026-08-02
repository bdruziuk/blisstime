"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MasterListingCard, type MasterListingItem } from "./master-listing-card";

const PAGE_SIZE = 24;

export function LazyListingGrid({ items }: { items: Array<MasterListingItem & { staffId: string }> }) {
  const [visibleCount, setVisibleCount] = useState(() => Math.min(PAGE_SIZE, items.length));
  const markerRef = useRef<HTMLDivElement>(null);
  const hasMore = visibleCount < items.length;

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker || !hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setVisibleCount((current) => Math.min(current + PAGE_SIZE, items.length));
      }
    }, { rootMargin: "500px 0px" });
    observer.observe(marker);
    return () => observer.disconnect();
  }, [hasMore, items.length]);

  return <><div className="grid gap-4 sm:grid-cols-2">{items.slice(0, visibleCount).map((item) => <MasterListingCard key={item.staffId} item={item} />)}</div>{hasMore && <div ref={markerRef} className="flex flex-col items-center gap-2 py-6"><Loader2 className="text-primary size-5 animate-spin" /><Button variant="outline" size="sm" onClick={() => setVisibleCount((current) => Math.min(current + PAGE_SIZE, items.length))}>Показати ще</Button><p className="text-muted-foreground text-xs">Показано {visibleCount} із {items.length}</p></div>}</>;
}
