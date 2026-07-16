"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateService, removeService, type ActionState } from "@/features/booking/actions";

type Category = { id: string; name: string; parentName: string };
type ServiceItem = {
  id: string;
  displayName: string;
  priceCents: number;
  durationMinutes: number;
  categoryId: string;
};

export function EditableServiceRow({
  service,
  categories,
}: {
  service: ServiceItem;
  categories: Category[];
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateService,
    undefined
  );
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setEditing(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  if (!editing) {
    return (
      <li className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
        <span>
          {service.displayName} — {(service.priceCents / 100).toFixed(2)} грн,{" "}
          {service.durationMinutes} хв
        </span>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(true)}>
            Редагувати
          </Button>
          <form action={removeService.bind(null, service.id)}>
            <Button type="submit" variant="ghost" size="sm">
              Видалити
            </Button>
          </form>
        </div>
      </li>
    );
  }

  return (
    <li className="rounded-md border p-3 text-sm">
      <form action={formAction} className="flex flex-col gap-2">
        <input type="hidden" name="serviceId" value={service.id} />
        <select
          name="categoryId"
          required
          defaultValue={service.categoryId}
          className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.parentName} / {c.name}
            </option>
          ))}
        </select>
        <Input name="displayName" defaultValue={service.displayName} required />
        <div className="flex gap-2">
          <Input
            name="price"
            type="number"
            min={1}
            step="0.01"
            defaultValue={(service.priceCents / 100).toFixed(2)}
            required
            className="flex-1"
          />
          <Input
            name="durationMinutes"
            type="number"
            min={15}
            step={15}
            defaultValue={service.durationMinutes}
            required
            className="flex-1"
          />
        </div>
        {state?.error && <p className="text-destructive text-xs">{state.error}</p>}
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Збереження..." : "Зберегти"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Скасувати
          </Button>
        </div>
      </form>
    </li>
  );
}
