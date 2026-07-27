"use client";

import { useActionState } from "react";
import { updateLocation, type ActionState } from "@/features/booking/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LocationForm({
  defaultCity,
  defaultAddress,
  defaultDistrict,
}: {
  defaultCity: string;
  defaultAddress: string;
  defaultDistrict: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateLocation,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="loc-city">Місто</Label>
        <Input id="loc-city" name="city" defaultValue={defaultCity} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="loc-district">Район (необов&apos;язково)</Label>
        <Input
          id="loc-district"
          name="district"
          defaultValue={defaultDistrict}
          placeholder="Напр. Печерський"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="loc-address">Адреса</Label>
        <Input id="loc-address" name="address" defaultValue={defaultAddress} required />
      </div>
      {state?.error && <p className="text-destructive text-sm">{state.error}</p>}
      <Button type="submit" size="sm" disabled={pending} className="self-start">
        {pending ? "Збереження..." : "Зберегти"}
      </Button>
    </form>
  );
}
