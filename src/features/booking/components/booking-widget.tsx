"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createBooking,
  getAvailableSlots,
  type ActionState,
} from "@/features/booking/public-actions";

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

export function BookingWidget({
  staffId,
  services,
}: {
  staffId: string;
  services: ServiceItem[];
}) {
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotOption | null>(null);

  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createBooking,
    undefined
  );

  useEffect(() => {
    if (!selectedServiceId) return;
    setSelectedSlot(null);
    setLoadingSlots(true);
    getAvailableSlots(staffId, selectedServiceId, date)
      .then(setSlots)
      .finally(() => setLoadingSlots(false));
  }, [staffId, selectedServiceId, date]);

  if (state && "success" in state) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-lg font-medium">Вас записано!</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Майстер зв&apos;яжеться з вами за потреби.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {services.map((service) => (
          <button
            key={service.id}
            type="button"
            onClick={() => setSelectedServiceId(service.id)}
            className={`rounded-md border px-4 py-3 text-left text-sm transition-colors ${
              selectedServiceId === service.id
                ? "border-primary bg-accent"
                : "border-input hover:bg-accent/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{service.displayName}</span>
              <span>{(service.priceCents / 100).toFixed(0)} грн</span>
            </div>
            <div className="text-muted-foreground text-xs">
              {service.categoryName} · {service.durationMinutes} хв
            </div>
          </button>
        ))}
      </div>

      {selectedServiceId && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="booking-date">Дата</Label>
            <Input
              id="booking-date"
              type="date"
              value={date}
              min={todayISO()}
              onChange={(e) => setDate(e.target.value)}
              className="w-48"
            />
          </div>

          {loadingSlots && <p className="text-muted-foreground text-sm">Завантаження...</p>}

          {!loadingSlots && slots.length === 0 && (
            <p className="text-muted-foreground text-sm">Немає вільних слотів на цю дату.</p>
          )}

          {!loadingSlots && slots.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.startISO}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`rounded-md border px-3 py-1.5 text-sm ${
                    selectedSlot?.startISO === slot.startISO
                      ? "border-primary bg-accent"
                      : "border-input hover:bg-accent/50"
                  }`}
                >
                  {formatTime(slot.startISO)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedSlot && selectedServiceId && (
        <form action={formAction} className="flex flex-col gap-3 border-t pt-4">
          <input type="hidden" name="serviceId" value={selectedServiceId} />
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
          <Button type="submit" disabled={pending}>
            {pending ? "Записуємо..." : "Підтвердити запис"}
          </Button>
        </form>
      )}
    </div>
  );
}
