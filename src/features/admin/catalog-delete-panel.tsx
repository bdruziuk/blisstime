"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Item = { id: string; name: string; detail: string; protected?: boolean };

function DeleteList({ title, type, initialItems }: { title: string; type: "masters" | "salons"; initialItems: Item[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const selectable = items.filter((item) => !item.protected);
  const allSelected = selectable.length > 0 && selectable.every((item) => selected.has(item.id));

  function toggle(id: string) { setSelected((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; }); }
  async function removeSelected() {
    if (!selected.size || !window.confirm(`Видалити вибрані записи (${selected.size})? Цю дію неможливо скасувати.`)) return;
    setLoading(true);
    try {
      const response = await fetch("/api/admin/catalog/bulk-delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, ids: [...selected] }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Не вдалося видалити записи");
      setItems((current) => current.filter((item) => !selected.has(item.id)));
      setSelected(new Set());
      router.refresh();
    } catch (error) { window.alert(error instanceof Error ? error.message : "Не вдалося видалити записи"); }
    finally { setLoading(false); }
  }

  return <div className="border-border rounded-xl border"><div className="flex flex-wrap items-center gap-3 border-b p-3"><h3 className="mr-auto font-semibold">{title} ({items.length})</h3><label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(selectable.map((item) => item.id)))} />Вибрати всі</label><Button size="sm" variant="destructive" disabled={!selected.size || loading} onClick={removeSelected}>{loading ? <Loader2 className="animate-spin" /> : <Trash2 />}Видалити вибрані ({selected.size})</Button></div><div className="max-h-72 divide-y overflow-auto">{items.map((item) => <label key={item.id} className={`flex items-start gap-3 p-3 text-sm ${item.protected ? "opacity-60" : "cursor-pointer hover:bg-accent/30"}`}><input type="checkbox" className="mt-1" disabled={item.protected} checked={selected.has(item.id)} onChange={() => toggle(item.id)} /><span><strong className="block">{item.name}</strong><span className="text-muted-foreground text-xs">{item.detail}</span>{item.protected && <span className="text-primary ml-2 text-xs">захищений акаунт</span>}</span></label>)}{items.length === 0 && <p className="text-muted-foreground p-6 text-center text-sm">Записів немає</p>}</div></div>;
}

export function CatalogDeletePanel({ masters, salons }: { masters: Item[]; salons: Item[] }) {
  return <section className="border-destructive/20 bg-card rounded-2xl border p-5 shadow-sm"><div className="mb-4"><h2 className="font-heading text-xl font-bold">Видалення записів</h2><p className="text-muted-foreground text-sm">Видалення остаточне: для майстра також видаляються записи, послуги та пов’язані налаштування.</p></div><div className="grid gap-4 lg:grid-cols-2"><DeleteList title="Майстри" type="masters" initialItems={masters} /><DeleteList title="Імпортовані салони" type="salons" initialItems={salons} /></div></section>;
}
