"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updateBookingSettings, type ActionState } from "@/features/booking/admin-actions";
import { CONFIRMATION_MODES, CONFIRMATION_MODE_LABELS } from "@/features/booking/schemas";

const HOLD_OPTIONS = [
  { minutes: 120, label: "2 години" },
  { minutes: 180, label: "3 години" },
  { minutes: 240, label: "4 години" },
];

export function SettingsForm({
  defaultConfirmationMode,
  defaultHoldDurationMinutes,
}: {
  defaultConfirmationMode: string;
  defaultHoldDurationMinutes: number;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateBookingSettings,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmationMode">Підтвердження записів</Label>
        <select
          id="confirmationMode"
          name="confirmationMode"
          defaultValue={defaultConfirmationMode}
          className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs"
        >
          {CONFIRMATION_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {CONFIRMATION_MODE_LABELS[mode]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="holdDurationMinutes">Тривалість холду для заявок</Label>
        <select
          id="holdDurationMinutes"
          name="holdDurationMinutes"
          defaultValue={defaultHoldDurationMinutes}
          className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs"
        >
          {HOLD_OPTIONS.map((opt) => (
            <option key={opt.minutes} value={opt.minutes}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {state && "error" in state && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Збереження..." : "Зберегти"}
      </Button>
    </form>
  );
}
