"use client";

import { useRef } from "react";
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
  { value: "4", label: "4+" },
  { value: "4.5", label: "4.5+" },
];

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

  return (
    <form
      ref={formRef}
      action="/search"
      method="GET"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
    >
      <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-1">
        <Label htmlFor="filter-category">Послуга</Label>
        <select
          id="filter-category"
          name="category"
          defaultValue={defaultValues.category ?? ""}
          onChange={() => formRef.current?.requestSubmit()}
          className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs"
        >
          <option value="">Усі послуги</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.parentName} / {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-city">Місто</Label>
        <Input id="filter-city" name="city" list="filter-cities" defaultValue={defaultValues.city ?? ""} placeholder="Напр. Київ" />
        <datalist id="filter-cities">
          {cities.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-type">Тип</Label>
        <select
          id="filter-type"
          name="type"
          defaultValue={defaultValues.type}
          onChange={() => formRef.current?.requestSubmit()}
          className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs"
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-min-price">Від, грн</Label>
        <Input
          id="filter-min-price"
          name="minPrice"
          type="number"
          min={0}
          defaultValue={defaultValues.minPrice ?? ""}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-max-price">До, грн</Label>
        <Input
          id="filter-max-price"
          name="maxPrice"
          type="number"
          min={0}
          defaultValue={defaultValues.maxPrice ?? ""}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-rating">Рейтинг</Label>
        <select
          id="filter-rating"
          name="minRating"
          defaultValue={defaultValues.minRating ?? ""}
          onChange={() => formRef.current?.requestSubmit()}
          className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs"
        >
          {RATING_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-sort">Сортування</Label>
        <select
          id="filter-sort"
          name="sort"
          defaultValue={defaultValues.sort}
          onChange={() => formRef.current?.requestSubmit()}
          className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="col-span-2 flex items-end gap-2 sm:col-span-3 lg:col-span-6">
        <Button type="submit" size="sm">
          Застосувати
        </Button>
        <Button type="button" variant="ghost" size="sm" render={<a href="/search" />} nativeButton={false}>
          Скинути фільтри
        </Button>
      </div>
    </form>
  );
}
