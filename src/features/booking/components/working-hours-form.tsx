"use client";

import { useActionState } from "react";
import { updateWorkingHours, type ActionState } from "@/features/booking/actions";
import { DAYS, DAY_LABELS, type Day } from "@/features/booking/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Hours = Partial<Record<Day, { open?: boolean; from?: string; to?: string }>>;

export function WorkingHoursForm({ defaultHours }: { defaultHours: Hours }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(updateWorkingHours, undefined);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {DAYS.map((day) => {
          const value = defaultHours[day];
          return (
            <div key={day} className="min-w-0 space-y-2 rounded-lg border p-2.5">
              <label className="flex min-w-0 items-center gap-2 text-sm font-medium">
                <input type="checkbox" name={`${day}_open`} defaultChecked={value?.open ?? day !== "sun"} />
                {DAY_LABELS[day]}
              </label>
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                <Input type="time" name={`${day}_from`} defaultValue={value?.from ?? "09:00"} className="min-w-0 w-full px-2" aria-label={`${DAY_LABELS[day]}: початок`} />
                <span className="text-muted-foreground text-center">—</span>
                <Input type="time" name={`${day}_to`} defaultValue={value?.to ?? "18:00"} className="min-w-0 w-full px-2" aria-label={`${DAY_LABELS[day]}: завершення`} />
              </div>
            </div>
          );
        })}
      </div>
      {state?.error && <p className="text-destructive text-sm">{state.error}</p>}
      {!state?.error && state !== undefined && <p className="text-emerald-600 text-sm">Графік збережено</p>}
      <Button type="submit" size="sm" disabled={pending} className="self-start">{pending ? "Збереження..." : "Зберегти графік"}</Button>
    </form>
  );
}
