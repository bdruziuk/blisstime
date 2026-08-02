"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

export function AdminUnifiedSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams();
      const normalized = query.trim();
      if (normalized) params.set("query", normalized);
      router.replace(params.size ? `${pathname}?${params}` : pathname, { scroll: false });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [pathname, query, router]);

  return (
    <div className="relative w-full">
      <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Пошук за назвою салону, ім’ям або email..."
        className="pl-9"
      />
    </div>
  );
}
