"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

/**
 * A real dropdown for the city filter: the trigger shows the selected city
 * (or "Усі міста"), and the open panel always lists the full set of cities
 * plus an optional search box — unlike a <datalist>, which collapses to just
 * the already-typed value. Submits the parent form on selection.
 */
function CityDropdown({
  cities,
  defaultValue,
  onSelect,
}: {
  cities: string[];
  defaultValue: string;
  onSelect: (city: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const filtered = query
    ? cities.filter((c) => c.toLowerCase().includes(query.toLowerCase()))
    : cities;

  function choose(city: string) {
    setOpen(false);
    setQuery("");
    onSelect(city);
  }

  return (
    <div ref={ref} className="relative">
      <input type="hidden" name="city" value={defaultValue} />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="border-input flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs"
      >
        <span className={defaultValue ? "" : "text-muted-foreground"}>
          {defaultValue || "Усі міста"}
        </span>
        <ChevronDown className="text-muted-foreground size-4 shrink-0" />
      </button>

      {open && (
        <div className="border-border bg-popover text-popover-foreground absolute z-30 mt-1 w-full overflow-hidden rounded-md border shadow-lg">
          {cities.length > 6 && (
            <div className="border-border border-b p-1.5">
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Пошук міста..."
                className="h-8"
              />
            </div>
          )}
          <div className="max-h-56 overflow-y-auto p-1" role="listbox">
            <CityOption label="Усі міста" selected={defaultValue === ""} onClick={() => choose("")} />
            {filtered.map((c) => (
              <CityOption
                key={c}
                label={c}
                selected={defaultValue === c}
                onClick={() => choose(c)}
              />
            ))}
            {filtered.length === 0 && (
              <p className="text-muted-foreground px-2 py-1.5 text-sm">Місто не знайдено</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CityOption({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onClick}
      className="hover:bg-accent/60 aria-selected:bg-accent aria-selected:text-accent-foreground flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors aria-selected:font-semibold"
    >
      {label}
      {selected && <Check className="size-3.5 shrink-0" />}
    </button>
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

  const [cityValue, setCityValue] = useState(defaultValues.city ?? "");
  const cityDirty = useRef(false);
  useEffect(() => {
    if (!cityDirty.current) return;
    cityDirty.current = false;
    submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityValue]);

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
          <CityDropdown
            cities={cities}
            defaultValue={cityValue}
            onSelect={(city) => {
              cityDirty.current = true;
              setCityValue(city);
            }}
          />
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
