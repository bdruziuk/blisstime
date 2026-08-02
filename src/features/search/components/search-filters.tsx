"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slugify";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Category = { slug: string; name: string };

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
 * A real dropdown filter (used for city and district): the trigger shows the
 * selected value (or an "all" label), and the open panel always lists every
 * option plus an optional search box — unlike a <datalist>, which collapses to
 * just the already-typed value. Submits the parent form on selection.
 */
function FilterDropdown({
  name,
  options,
  defaultValue,
  allLabel,
  searchPlaceholder,
  emptyLabel,
  onSelect,
}: {
  name: string;
  options: string[];
  defaultValue: string;
  allLabel: string;
  searchPlaceholder: string;
  emptyLabel: string;
  onSelect: (value: string) => void;
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
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  function choose(value: string) {
    setOpen(false);
    setQuery("");
    onSelect(value);
  }

  return (
    <div ref={ref} className="relative">
      <input type="hidden" name={name} value={defaultValue} />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="border-input flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs"
      >
        <span className={defaultValue ? "" : "text-muted-foreground"}>
          {defaultValue || allLabel}
        </span>
        <ChevronDown className="text-muted-foreground size-4 shrink-0" />
      </button>

      {open && (
        <div className="border-border bg-popover text-popover-foreground absolute z-30 mt-1 w-full overflow-hidden rounded-md border shadow-lg">
          {options.length > 6 && (
            <div className="border-border border-b p-1.5">
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-8"
              />
            </div>
          )}
          <div className="max-h-56 overflow-y-auto p-1" role="listbox">
            <DropdownOption label={allLabel} selected={defaultValue === ""} onClick={() => choose("")} />
            {filtered.map((o) => (
              <DropdownOption
                key={o}
                label={o}
                selected={defaultValue === o}
                onClick={() => choose(o)}
              />
            ))}
            {filtered.length === 0 && (
              <p className="text-muted-foreground px-2 py-1.5 text-sm">{emptyLabel}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DropdownOption({
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
  districts,
  defaultValues,
}: {
  categories: Category[];
  cities: string[];
  districts: string[];
  defaultValues: {
    category?: string;
    city?: string;
    district?: string;
    type: string;
    minPrice?: string;
    maxPrice?: string;
    minRating?: string;
    sort: string;
    q?: string;
  };
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const submit = () => formRef.current?.requestSubmit();

  function submitToCatalog(form: HTMLFormElement) {
    const data = new FormData(form);
    const city = String(data.get("city") ?? "");
    if (!city) {
      const query = new URLSearchParams();
      for (const key of ["q", "category", "type", "minPrice", "maxPrice", "minRating", "sort"]) {
        const value = String(data.get(key) ?? "");
        if (value && value !== "all" && value !== "default") query.set(key, value);
      }
      router.push(query.size ? `/search?${query}` : "/search");
      return;
    }
    const district = String(data.get("district") ?? "");
    const service = String(data.get("category") ?? "") || "all";
    const citySlug = slugify(city);
    const path = city === "Київ" ? `/${citySlug}/${district ? slugify(district) : "all"}/${service}` : `/${citySlug}/${service}`;
    const query = new URLSearchParams();
    for (const key of ["q", "type", "minPrice", "maxPrice", "minRating", "sort"]) {
      const value = String(data.get(key) ?? "");
      if (value && value !== "all" && value !== "default") query.set(key, value);
    }
    router.push(query.size ? `${path}?${query}` : path);
  }

  const [cityValue, setCityValue] = useState(defaultValues.city ?? "");
  const cityDirty = useRef(false);
  useEffect(() => {
    if (!cityDirty.current) return;
    cityDirty.current = false;
    submit();
  }, [cityValue]);

  const [districtValue, setDistrictValue] = useState(defaultValues.district ?? "");
  const districtDirty = useRef(false);
  useEffect(() => {
    if (!districtDirty.current) return;
    districtDirty.current = false;
    submit();
  }, [districtValue]);

  const selectedCategory = defaultValues.category ?? "";
  const selectedRating = defaultValues.minRating ?? "";

  return (
    <aside className="w-full shrink-0 lg:sticky lg:top-6 lg:w-64">
      <form
        ref={formRef}
        onSubmit={(event) => { event.preventDefault(); submitToCatalog(event.currentTarget); }}
        className="border-border bg-card flex flex-col gap-5 rounded-xl border p-4"
      >
        <input type="hidden" name="sort" value={defaultValues.sort} />
        {defaultValues.q && <input type="hidden" name="q" value={defaultValues.q} />}
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
            {categories.map((c) => (
              <RadioRow
                key={c.slug}
                name="category"
                value={c.slug}
                label={c.name}
                checked={selectedCategory === c.slug}
                onChange={submit}
              />
            ))}
          </div>
        </FilterGroup>

        <FilterGroup title="Місто">
          <FilterDropdown
            name="city"
            options={cities}
            defaultValue={cityValue}
            allLabel="Усі міста"
            searchPlaceholder="Пошук міста..."
            emptyLabel="Місто не знайдено"
            onSelect={(city) => {
              document.cookie = city ? `catalog_city=${encodeURIComponent(city)}; Path=/; Max-Age=31536000; SameSite=Lax` : "catalog_city=; Path=/; Max-Age=0; SameSite=Lax";
              cityDirty.current = true;
              setCityValue(city);
            }}
          />
        </FilterGroup>

        {districts.length > 0 && (
          <FilterGroup title="Район">
            <FilterDropdown
              name="district"
              options={districts}
              defaultValue={districtValue}
              allLabel="Усі райони"
              searchPlaceholder="Пошук району..."
              emptyLabel="Район не знайдено"
              onSelect={(district) => {
                districtDirty.current = true;
                setDistrictValue(district);
              }}
            />
          </FilterGroup>
        )}

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

        <Button type="submit" size="sm" className="w-full">
          Застосувати
        </Button>
      </form>
    </aside>
  );
}
