"use client";

import { useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Category = { id: string; name: string; parentName: string };

const SORT_OPTIONS = [
  { value: "default", label: "За замовчуванням" },
  { value: "price_asc", label: "Спочатку дешевші" },
  { value: "price_desc", label: "Спочатку дорожчі" },
  { value: "rating_desc", label: "Спочатку з вищим рейтингом" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "Усі" },
  { value: "salon", label: "Тільки салони" },
  { value: "solo", label: "Тільки приватні майстри" },
];

const RATING_OPTIONS = [
  { value: "", label: "Будь-який рейтинг" },
  { value: "4", label: "Від 4 зірок" },
  { value: "4.5", label: "Від 4.5 зірок" },
];

function RadioRow({
  name,
  value,
  label,
  checked,
  onChange,
}: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="hover:bg-accent/60 has-[:checked]:bg-accent has-[:checked]:text-accent-foreground flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors has-[:checked]:font-semibold">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={checked}
        onChange={onChange}
        className="accent-primary size-3.5"
      />
      {label}
    </label>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{title}</p>
      {children}
    </div>
  );
}

export function SearchFilters({
  categories,
  cities,
  defaultValues,
}: {
  categories: Category[];
  cities: string[];
  defaultValues: {
    category?: string;
    city?: string;
    type: string;
    minPrice?: string;
    maxPrice?: string;
    minRating?: string;
    sort: string;
  };
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const submit = () => formRef.current?.requestSubmit();

  const grouped = new Map<string, Category[]>();
  for (const c of categories) {
    const list = grouped.get(c.parentName) ?? [];
    list.push(c);
    grouped.set(c.parentName, list);
  }

  const selectedCategory = defaultValues.category ?? "";
  const selectedRating = defaultValues.minRating ?? "";

  return (
    <aside className="w-full shrink-0 lg:sticky lg:top-6 lg:w-64">
      <form
        ref={formRef}
        action="/search"
        method="GET"
        className="border-border bg-card flex flex-col gap-5 rounded-xl border p-4"
      >
        <div className="flex items-center justify-between">
          <p className="font-heading text-base font-bold">Фільтри</p>
          <Link
            href="/search"
            className="text-muted-foreground hover:text-primary text-xs underline underline-offset-4"
          >
            Скинути
          </Link>
        </div>

        <FilterGroup title="Послуга">
          <div className="-mx-1 max-h-64 overflow-y-auto pr-1">
            <RadioRow
              name="category"
              value=""
              label="Усі послуги"
              checked={selectedCategory === ""}
              onChange={submit}
            />
            {[...grouped.entries()].map(([parentName, items]) => (
              <div key={parentName} className="mt-1.5">
                <p className="text-muted-foreground px-2 pt-1 pb-0.5 text-xs font-medium">
                  {parentName}
                </p>
                {items.map((c) => (
                  <RadioRow
                    key={c.id}
                    name="category"
                    value={c.id}
                    label={c.name}
                    checked={selectedCategory === c.id}
                    onChange={submit}
                  />
                ))}
              </div>
            ))}
          </div>
        </FilterGroup>

        <FilterGroup title="Місто">
          <Input
            id="filter-city"
            name="city"
            list="filter-cities"
            defaultValue={defaultValues.city ?? ""}
            placeholder="Напр. Київ"
          />
          <datalist id="filter-cities">
            {cities.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </FilterGroup>

        <FilterGroup title="Тип">
          <div className="-mx-1">
            {TYPE_OPTIONS.map((opt) => (
              <RadioRow
                key={opt.value}
                name="type"
                value={opt.value}
                label={opt.label}
                checked={defaultValues.type === opt.value}
                onChange={submit}
              />
            ))}
          </div>
        </FilterGroup>

        <FilterGroup title="Ціна, грн">
          <div className="flex items-center gap-2">
            <Input
              id="filter-min-price"
              name="minPrice"
              type="number"
              min={0}
              placeholder="від"
              defaultValue={defaultValues.minPrice ?? ""}
            />
            <span className="text-muted-foreground">–</span>
            <Input
              id="filter-max-price"
              name="maxPrice"
              type="number"
              min={0}
              placeholder="до"
              defaultValue={defaultValues.maxPrice ?? ""}
            />
          </div>
        </FilterGroup>

        <FilterGroup title="Рейтинг">
          <div className="-mx-1">
            {RATING_OPTIONS.map((opt) => (
              <RadioRow
                key={opt.value}
                name="minRating"
                value={opt.value}
                label={opt.label}
                checked={selectedRating === opt.value}
                onChange={submit}
              />
            ))}
          </div>
        </FilterGroup>

        <FilterGroup title="Сортування">
          <div className="-mx-1">
            {SORT_OPTIONS.map((opt) => (
              <RadioRow
                key={opt.value}
                name="sort"
                value={opt.value}
                label={opt.label}
                checked={defaultValues.sort === opt.value}
                onChange={submit}
              />
            ))}
          </div>
        </FilterGroup>

        <Button type="submit" size="sm" className="w-full">
          Застосувати
        </Button>
      </form>
    </aside>
  );
}
