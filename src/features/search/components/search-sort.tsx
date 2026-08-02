"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  { value: "default", label: "За замовчуванням" },
  { value: "price_asc", label: "Спочатку дешевші" },
  { value: "price_desc", label: "Спочатку дорожчі" },
  { value: "rating_desc", label: "За рейтингом" },
];

export function SearchSort({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function change(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "default") params.delete("sort"); else params.set("sort", next);
    router.push(params.size ? `${pathname}?${params}` : pathname);
  }

  return <label className="flex items-center gap-2 text-sm"><span className="text-muted-foreground hidden sm:inline">Сортування:</span><select value={value} onChange={(event) => change(event.target.value)} className="border-input bg-background h-9 rounded-md border px-3 text-sm shadow-xs">{OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}
