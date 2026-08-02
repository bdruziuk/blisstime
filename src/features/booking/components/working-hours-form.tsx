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
            <div key={day} className="grid grid-cols-[1fr_auto] items-center gap-2 sm:grid-cols-[8rem_7rem_auto_7rem]">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" name={`${day}_open`} defaultChecked={value?.open ?? day !== "sun"} />
                {DAY_LABELS[day]}
              </label>
              <span className="text-muted-foreground text-xs sm:hidden">робочий день</span>
              <Input type="time" name={`${day}_from`} defaultValue={value?.from ?? "09:00"} className="w-full" aria-label={`${DAY_LABELS[day]}: початок`} />
              <span className="text-muted-foreground hidden text-center sm:block">—</span>
              <Input type="time" name={`${day}_to`} defaultValue={value?.to ?? "18:00"} className="w-full" aria-label={`${DAY_LABELS[day]}: завершення`} />
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
