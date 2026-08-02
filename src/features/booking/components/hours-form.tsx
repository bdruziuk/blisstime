"use client";

import { useActionState } from "react";
import { saveLocationAndFinish, type ActionState } from "@/features/booking/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DAYS, DAY_LABELS } from "@/features/booking/schemas";

export function HoursForm({ defaultCity = "", defaultDistrict = "", defaultAddress = "" }: { defaultCity?: string; defaultDistrict?: string; defaultAddress?: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    saveLocationAndFinish,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="city">Місто</Label>
        <Input id="city" name="city" defaultValue={defaultCity} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="district">Район (необов&apos;язково)</Label>
        <Input id="district" name="district" defaultValue={defaultDistrict} placeholder="Напр. Печерський" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="address">Адреса</Label>
        <Input id="address" name="address" defaultValue={defaultAddress} required />
      </div>

      <div className="flex flex-col gap-2">
        {DAYS.map((day) => (
          <div key={day} className="flex items-center gap-3">
            <label className="flex w-32 items-center gap-2 text-sm">
              <input
                type="checkbox"
                name={`${day}_open`}
                defaultChecked={day !== "sun"}
              />
              {DAY_LABELS[day]}
            </label>
            <Input
              type="time"
              name={`${day}_from`}
              defaultValue="09:00"
              className="w-28"
            />
            <span className="text-muted-foreground">—</span>
            <Input type="time" name={`${day}_to`} defaultValue="18:00" className="w-28" />
          </div>
        ))}
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Збереження..." : "Завершити"}
      </Button>
    </form>
  );
}
