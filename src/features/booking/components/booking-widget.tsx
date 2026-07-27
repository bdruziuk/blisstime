"use client";

import { useActionState, useEffect, useState } from "react";
import { CheckCircle2, Clock3, Check, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createBooking,
  getAvailableSlots,
  type ActionState,
} from "@/features/booking/public-actions";
import { WaitlistForm } from "@/features/booking/components/waitlist-form";

type ServiceItem = {
  id: string;
  displayName: string;
  priceCents: number;
  durationMinutes: number;
  categoryName: string;
};

type SlotOption = { startISO: string; endISO: string };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Kyiv",
  });
}

function StepLabel({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="bg-primary text-primary-foreground flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
        {n}
      </span>
      <p className="text-sm font-semibold">{children}</p>
    </div>
  );
}

export function BookingWidget({
  staffId,
  services,
}: {
  staffId: string;
  services: ServiceItem[];
}) {
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotOption | null>(null);

  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createBooking,
    undefined
  );

  const selectedServices = selectedServiceIds
    .map((id) => services.find((s) => s.id === id))
    .filter((s): s is ServiceItem => Boolean(s));
  const totalPriceCents = selectedServices.reduce((sum, s) => sum + s.priceCents, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
  const hasSelection = selectedServiceIds.length > 0;
  const serviceIdsKey = selectedServiceIds.join(",");

  function toggleService(id: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  useEffect(() => {
    if (!serviceIdsKey) {
      setSlots([]);
      return;
    }
    setSelectedSlot(null);
    setLoadingSlots(true);
    getAvailableSlots(staffId, serviceIdsKey.split(","), date)
      .then(setSlots)
      .finally(() => setLoadingSlots(false));
  }, [staffId, serviceIdsKey, date]);

  if (state && "success" in state) {
    const isPending = state.status === "PENDING";
    const Icon = isPending ? Clock3 : CheckCircle2;
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="bg-accent text-primary flex size-14 items-center justify-center rounded-full">
          <Icon className="size-7" strokeWidth={2} />
        </div>
        <p className="text-lg font-bold">
          {isPending ? "Заявку надіслано!" : "Вас записано!"}
        </p>
        <p className="text-muted-foreground max-w-xs text-sm">
          {isPending
            ? state.medianResponseMinutes
              ? `Майстер зазвичай підтверджує протягом ${state.medianResponseMinutes} хв.`
              : "Майстер підтвердить запис найближчим часом."
            : "Майстер зв'яжеться з вами за потреби."}
        </p>

        {state.telegramDeepLink && (
          <div className="mt-2 flex flex-col items-center gap-1.5">
            <Button
              render={<a href={state.telegramDeepLink} target="_blank" rel="noopener noreferrer" />}
              nativeButton={false}
              className="gap-2 rounded-full bg-[#229ED9] text-white hover:bg-[#1c8dc2]"
            >
              <Send className="size-4" />
              Повідомити в Telegram
            </Button>
            <p className="text-muted-foreground max-w-xs text-xs">
              Підтвердження запису, нагадування та запит відгуку — прямо в Telegram.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <StepLabel n={1}>Оберіть послуги</StepLabel>
        <div className="flex flex-col gap-2">
          {services.map((service) => {
            const selected = selectedServiceIds.includes(service.id);
            return (
              <button
                key={service.id}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleService(service.id)}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                  selected
                    ? "border-primary bg-accent shadow-sm"
                    : "border-border hover:border-primary/40 hover:bg-accent/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded-md border ${
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border"
                    }`}
                  >
                    {selected && <Check className="size-3.5" strokeWidth={3} />}
                  </span>
                  <div>
                    <div className="font-semibold">{service.displayName}</div>
                    <div className="text-muted-foreground text-xs">
                      {service.categoryName} · {service.durationMinutes} хв
                    </div>
                  </div>
                </div>
                <span className="text-primary font-bold">
                  {(service.priceCents / 100).toFixed(0)} грн
                </span>
              </button>
            );
          })}
        </div>

        {hasSelection && (
          <div className="bg-accent/50 flex items-center justify-between rounded-lg px-4 py-2.5 text-sm">
            <span className="text-muted-foreground">
              Обрано {selectedServices.length} · {totalDuration} хв
            </span>
            <span className="text-primary font-bold">
              {(totalPriceCents / 100).toFixed(0)} грн
            </span>
          </div>
        )}
      </div>

      {hasSelection && (
        <div className="flex flex-col gap-3 border-t pt-5">
          <StepLabel n={2}>Оберіть дату і час</StepLabel>
          <Input
            type="date"
            value={date}
            min={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            className="w-48"
          />

          {loadingSlots && <p className="text-muted-foreground text-sm">Завантаження...</p>}

          {!loadingSlots && slots.length === 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-muted-foreground text-sm">Немає вільних слотів на цю дату.</p>
              <WaitlistForm staffId={staffId} dateISO={date} />
            </div>
          )}

          {!loadingSlots && slots.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.startISO}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all ${
                    selectedSlot?.startISO === slot.startISO
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border hover:border-primary/40 hover:bg-accent/40"
                  }`}
                >
                  {formatTime(slot.startISO)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedSlot && hasSelection && (
        <div className="flex flex-col gap-3 border-t pt-5">
          <StepLabel n={3}>Ваші контакти</StepLabel>
          <form action={formAction} className="flex flex-col gap-3">
            <input type="hidden" name="serviceIds" value={serviceIdsKey} />
            <input type="hidden" name="slotStartISO" value={selectedSlot.startISO} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="clientName">Ваше ім&apos;я</Label>
              <Input id="clientName" name="clientName" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="clientPhone">Телефон</Label>
              <Input
                id="clientPhone"
                name="clientPhone"
                type="tel"
                placeholder="+380501234567"
                required
              />
            </div>
            {state && "error" in state && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            <Button
              type="submit"
              disabled={pending}
              className="h-11 gap-2 rounded-full bg-gradient-to-b from-primary to-primary/85 text-base font-semibold shadow-lg shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/35 active:translate-y-0"
            >
              {pending ? "Записуємо..." : "Підтвердити запис"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
