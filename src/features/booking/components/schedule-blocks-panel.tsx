"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addScheduleBlock,
  removeScheduleBlock,
  type ActionState,
} from "@/features/booking/admin-actions";

type BlockItem = {
  id: string;
  startsAtISO: string;
  endsAtISO: string;
  reason: string | null;
};

function formatBlock(block: BlockItem) {
  const start = new Date(block.startsAtISO);
  const end = new Date(block.endsAtISO);
  const dateLabel = start.toLocaleDateString("uk-UA", {
    timeZone: "Europe/Kyiv",
    day: "numeric",
    month: "long",
  });

  const durationMs = end.getTime() - start.getTime();
  const isWholeDay = durationMs >= 23 * 60 * 60 * 1000;
  if (isWholeDay) return `${dateLabel} · весь день`;

  const timeFmt = (d: Date) =>
    d.toLocaleTimeString("uk-UA", {
      timeZone: "Europe/Kyiv",
      hour: "2-digit",
      minute: "2-digit",
    });
  return `${dateLabel} · ${timeFmt(start)}–${timeFmt(end)}`;
}

function todayISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Kyiv" }).format(new Date());
}

export function ScheduleBlocksPanel({ blocks }: { blocks: BlockItem[] }) {
  const [wholeDay, setWholeDay] = useState(true);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addScheduleBlock,
    undefined
  );

  return (
    <div className="flex flex-col gap-4">
      {blocks.length > 0 && (
        <ul className="flex flex-col gap-2">
          {blocks.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <span>
                {formatBlock(b)}
                {b.reason && <span className="text-muted-foreground"> — {b.reason}</span>}
              </span>
              <form action={removeScheduleBlock.bind(null, b.id)}>
                <Button type="submit" variant="ghost" size="sm">
                  Видалити
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="flex flex-col gap-3 border-t pt-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="block-date">Дата</Label>
          <Input id="block-date" name="date" type="date" min={todayISO()} required className="w-48" />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="wholeDay"
            checked={wholeDay}
            onChange={(e) => setWholeDay(e.target.checked)}
          />
          Весь день
        </label>

        {!wholeDay && (
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="block-from">Від</Label>
              <Input id="block-from" name="fromTime" type="time" defaultValue="13:00" required />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="block-to">До</Label>
              <Input id="block-to" name="toTime" type="time" defaultValue="14:00" required />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="block-reason">Причина (необов&apos;язково)</Label>
          <Input id="block-reason" name="reason" placeholder="Відпустка, перерва на обід..." />
        </div>

        {state?.error && <p className="text-destructive text-sm">{state.error}</p>}
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Додавання..." : "Додати вихідний/перерву"}
        </Button>
      </form>
    </div>
  );
}
