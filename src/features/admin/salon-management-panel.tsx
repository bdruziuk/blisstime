"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Item = {
  id: string;
  deleteId: string;
  kind: "manual" | "imported_unowned" | "imported_owned";
  name: string;
  address: string;
  city: string;
  owner: string | null;
  claimUrl: string | null;
};

const FILTERS = [
  { value: "all", label: "Усі салони" },
  { value: "manual", label: "Створені вручну" },
  { value: "imported_unowned", label: "Імпортовані без власника" },
  { value: "imported_owned", label: "Імпортовані з власником" },
];

export function SalonManagementPanel() {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const marker = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  const load = useCallback(async (nextPage: number, replace = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ filter, page: String(nextPage) });
      if (debouncedQuery) params.set("query", debouncedQuery);
      const response = await fetch(`/api/admin/salons?${params}`, { cache: "no-store" });
      const data = await response.json() as { items: Item[]; total: number; hasMore: boolean; error?: string };
      if (!response.ok) throw new Error(data.error);
      setItems((current) => replace ? data.items : [
        ...current,
        ...data.items.filter((item) => !current.some((old) => old.id === item.id && old.kind === item.kind)),
      ]);
      setTotal(data.total);
      setHasMore(data.hasMore);
      setPage(nextPage);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, filter]);

  useEffect(() => {
    setSelected(new Set());
    void load(0, true);
  }, [load]);

  useEffect(() => {
    const node = marker.current;
    if (!node || !hasMore || loading) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) void load(page + 1);
    }, { rootMargin: "400px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, load, loading, page]);

  const allSelected = items.length > 0 && items.every((item) => selected.has(`${item.kind}:${item.id}`));

  function toggle(key: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function remove() {
    if (!selected.size || !confirm(`Видалити вибрані салони (${selected.size})?`)) return;
    setLoading(true);
    try {
      const chosen = items.filter((item) => selected.has(`${item.kind}:${item.id}`));
      const groups = [
        { type: "salons", ids: chosen.filter((item) => item.kind !== "manual").map((item) => item.deleteId) },
        { type: "masters", ids: chosen.filter((item) => item.kind === "manual").map((item) => item.deleteId) },
      ];
      for (const group of groups) {
        for (let index = 0; index < group.ids.length; index += 500) {
          const response = await fetch("/api/admin/catalog/bulk-delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: group.type, ids: group.ids.slice(index, index + 500) }),
          });
          if (!response.ok) throw new Error((await response.json()).error);
        }
      }
      setSelected(new Set());
      await load(0, true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold">Салони</h2>
          <p className="text-muted-foreground text-sm">Усього: {total}</p>
        </div>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Пошук за назвою..."
          className="w-full sm:ml-auto sm:w-72"
        />
        <select value={filter} onChange={(event) => setFilter(event.target.value)} className="border-input bg-background h-9 rounded-md border px-3 text-sm">
          {FILTERS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(items.map((item) => `${item.kind}:${item.id}`)))} />
          Вибрати всі завантажені
        </label>
        <Button variant="destructive" disabled={!selected.size || loading} onClick={remove}>
          <Trash2 />Видалити ({selected.size})
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const key = `${item.kind}:${item.id}`;
          const imported = item.kind !== "manual";
          return (
            <article key={key} className={`rounded-xl border p-4 ${imported ? "border-orange-400/50 bg-orange-500/5" : "border-emerald-400/50 bg-emerald-500/5"}`}>
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={selected.has(key)} onChange={() => toggle(key)} className="mt-1" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{item.name}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${imported ? "bg-orange-500/15 text-orange-700" : "bg-emerald-500/15 text-emerald-700"}`}>
                      {imported ? "імпортований" : "створений вручну"}
                    </span>
                    {item.kind === "imported_owned" && <span className="bg-emerald-500/15 text-emerald-700 rounded-full px-2 py-0.5 text-xs"><Check className="mr-1 inline size-3" />є власник</span>}
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">{item.city}{item.address ? ` · ${item.address}` : ""}</p>
                  {item.owner && <p className="mt-1 text-sm">Власник: {item.owner}</p>}
                  {item.claimUrl && <div className="mt-3 flex gap-2"><input readOnly value={item.claimUrl} className="border-input bg-background min-w-0 flex-1 rounded-md border px-2 text-xs" /><Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(item.claimUrl!)}><Copy />Копіювати</Button></div>}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {hasMore && <div ref={marker} className="flex justify-center py-5">{loading ? <Loader2 className="animate-spin" /> : <Button variant="outline" onClick={() => void load(page + 1)}>Показати ще 50</Button>}</div>}
    </section>
  );
}
