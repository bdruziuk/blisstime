"use client";

import { useActionState } from "react";
import { addService, type ActionState } from "@/features/booking/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ServiceForm({
  categories,
}: {
  categories: { id: string; name: string; parentName: string }[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addService,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="categoryId">Категорія</Label>
        <select
          id="categoryId"
          name="categoryId"
          required
          className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs"
        >
          <option value="">Оберіть категорію</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.parentName} / {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="displayName">Назва послуги</Label>
        <Input id="displayName" name="displayName" required />
      </div>
      <div className="flex gap-4">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="price">Ціна, грн</Label>
          <Input id="price" name="price" type="number" min={1} step="0.01" required />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="durationMinutes">Тривалість, хв</Label>
          <Input
            id="durationMinutes"
            name="durationMinutes"
            type="number"
            min={15}
            step={15}
            required
          />
        </div>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} variant="secondary">
        {pending ? "Додавання..." : "Додати послугу"}
      </Button>
    </form>
  );
}
