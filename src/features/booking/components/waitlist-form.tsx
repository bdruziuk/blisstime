"use client";

import { useActionState, useState } from "react";
import { BellPlus, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { joinWaitlist, type WaitlistState } from "@/features/booking/waitlist-actions";

export function WaitlistForm({ staffId, dateISO }: { staffId: string; dateISO: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<WaitlistState, FormData>(
    joinWaitlist,
    undefined
  );

  if (state && "success" in state) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-4 text-center">
        <CheckCircle2 className="text-primary size-6" />
        <p className="text-sm font-semibold">Ви в черзі!</p>
        {state.telegramDeepLink ? (
          <>
            <p className="text-muted-foreground text-xs">
              Підключіть Telegram, щоб отримати пропозицію, коли час звільниться.
            </p>
            <Button
              render={
                <a href={state.telegramDeepLink} target="_blank" rel="noopener noreferrer" />
              }
              nativeButton={false}
              size="sm"
              className="gap-2 rounded-full bg-[#229ED9] text-white hover:bg-[#1c8dc2]"
            >
              <Send className="size-4" />
              Повідомити в Telegram
            </Button>
          </>
        ) : (
          <p className="text-muted-foreground text-xs">
            Повідомимо в Telegram, щойно час звільниться.
          </p>
        )}
      </div>
    );
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 self-start"
      >
        <BellPlus className="size-4" />
        Стати в чергу на цей день
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-xl border p-4">
      <p className="text-sm font-medium">
        Повідомимо, якщо на {dateISO} звільниться час.
      </p>
      <input type="hidden" name="staffId" value={staffId} />
      <input type="hidden" name="dateISO" value={dateISO} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="wl-name">Ваше ім&apos;я</Label>
        <Input id="wl-name" name="clientName" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="wl-phone">Телефон</Label>
        <Input id="wl-phone" name="clientPhone" type="tel" placeholder="+380501234567" required />
      </div>
      {state && "error" in state && <p className="text-destructive text-sm">{state.error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Додаємо..." : "У чергу"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Скасувати
        </Button>
      </div>
    </form>
  );
}
