"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Sparkles, Type, Image as ImageIcon, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { addService, type ActionState } from "@/features/booking/actions";
import { parsePriceList, parsePriceListFromImage } from "@/features/ai-import/parse-price-list";

type Category = { id: string; slug: string; name: string; parentName: string };
type ParsedItem = {
  displayName: string;
  price: number;
  durationMinutes: number;
  categorySlug: string;
};
type Mode = "text" | "image";

const FALLBACK_SLUG = "misc.other";

function ParsedItemRow({
  item,
  categories,
  onAdded,
}: {
  item: ParsedItem;
  categories: Category[];
  onAdded: () => void;
}) {
  const defaultCategory =
    categories.find((c) => c.slug === item.categorySlug) ?? categories[0];
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addService,
    undefined
  );
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      onAdded();
    }
    wasPending.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, state]);

  const unrecognized = item.categorySlug === FALLBACK_SLUG;

  return (
    <form
      action={formAction}
      className={`flex flex-col gap-2 rounded-md border p-3 text-sm ${
        unrecognized ? "border-amber-500" : "border-input"
      }`}
    >
      {unrecognized && (
        <p className="text-xs text-amber-600">
          Не вдалося впевнено визначити категорію — перевірте вручну.
        </p>
      )}
      <select
        name="categoryId"
        required
        defaultValue={defaultCategory?.id}
        className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs"
      >
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.parentName} / {c.name}
          </option>
        ))}
      </select>
      <Input name="displayName" defaultValue={item.displayName} required />
      <div className="flex gap-2">
        <Input
          name="price"
          type="number"
          min={1}
          step="0.01"
          defaultValue={item.price}
          required
          className="flex-1"
        />
        <Input
          name="durationMinutes"
          type="number"
          min={15}
          step={15}
          defaultValue={item.durationMinutes}
          required
          className="flex-1"
        />
      </div>
      {state?.error && <p className="text-destructive text-xs">{state.error}</p>}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Додавання..." : "Додати"}
      </Button>
    </form>
  );
}

export function AiImportPanel({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [items, setItems] = useState<ParsedItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);

  function handleSelectImage(file: File | null) {
    setImageFile(file);
    setImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  async function handleParseText() {
    setParsing(true);
    setError(null);
    const result = await parsePriceList(text);
    setParsing(false);
    if ("error" in result) {
      setError(result.error);
      setItems(null);
      return;
    }
    setItems(result.items);
  }

  async function handleParseImage() {
    if (!imageFile) return;
    setParsing(true);
    setError(null);
    const formData = new FormData();
    formData.set("image", imageFile);
    const result = await parsePriceListFromImage(formData);
    setParsing(false);
    if ("error" in result) {
      setError(result.error);
      setItems(null);
      return;
    }
    setItems(result.items);
  }

  if (!open) {
    return (
      <Button variant="secondary" className="gap-2" onClick={() => setOpen(true)}>
        <Sparkles className="size-4" />
        Імпортувати прайс (AI)
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="border-border inline-flex w-fit gap-1 rounded-md border p-1 text-sm">
          <button
            type="button"
            onClick={() => setMode("text")}
            className={`flex items-center gap-1.5 rounded px-3 py-1 ${
              mode === "text"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Type className="size-3.5" />
            Текст
          </button>
          <button
            type="button"
            onClick={() => setMode("image")}
            className={`flex items-center gap-1.5 rounded px-3 py-1 ${
              mode === "image"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ImageIcon className="size-3.5" />
            Фото
          </button>
        </div>

        {mode === "text" ? (
          <>
            <Label htmlFor="price-list-text">Встав текст прайсу</Label>
            <textarea
              id="price-list-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder={"Манікюр гель-лак - 800 грн, 1.5 год\nПедикюр класичний - 600 грн"}
              className="border-input w-full rounded-md border bg-transparent p-2 text-sm shadow-xs"
            />
          </>
        ) : (
          <>
            <Label htmlFor="price-list-image">Завантаж фото прайсу</Label>
            {imagePreviewUrl ? (
              <div className="relative w-fit">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreviewUrl}
                  alt="Прайс"
                  className="max-h-64 rounded-md border object-contain"
                />
                <button
                  type="button"
                  onClick={() => handleSelectImage(null)}
                  className="bg-background absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full border shadow-sm"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="price-list-image"
                className="border-border hover:border-primary/40 hover:bg-accent/40 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed p-8 text-sm"
              >
                <Upload className="text-muted-foreground size-6" />
                <span className="text-muted-foreground">Натисни, щоб обрати фото</span>
              </label>
            )}
            <input
              id="price-list-image"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleSelectImage(e.target.files?.[0] ?? null)}
            />
          </>
        )}

        {error && <p className="text-destructive text-sm">{error}</p>}
        <div className="flex gap-2">
          {mode === "text" ? (
            <Button type="button" onClick={handleParseText} disabled={parsing || !text.trim()}>
              {parsing ? "Розпізнаємо..." : "Розпізнати"}
            </Button>
          ) : (
            <Button type="button" onClick={handleParseImage} disabled={parsing || !imageFile}>
              {parsing ? "Розпізнаємо..." : "Розпізнати"}
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Закрити
          </Button>
        </div>

        {items && items.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-xs">
              Перевірте кожну послугу і натисніть «Додати».
            </p>
            {items.map((item, i) => (
              <ParsedItemRow
                key={`${item.displayName}-${i}`}
                item={item}
                categories={categories}
                onAdded={() => setItems((prev) => prev?.filter((_, idx) => idx !== i) ?? null)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
