"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  cancelBooking,
  confirmBooking,
  declineBooking,
  createManualBooking,
  rescheduleBooking,
  type ActionState,
} from "@/features/booking/admin-actions";
import { getAvailableSlots } from "@/features/booking/public-actions";
import { STATUS_LABELS, formatTime } from "@/features/booking/format";

type BookingItem = {
  id: string;
  status: string;
  slotStartISO: string;
  slotEndISO: string;
  holdExpiresAtISO: string | null;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  durationMinutes: number;
};

type ServiceItem = {
  id: string;
  displayName: string;
  durationMinutes: number;
  priceCents: number;
};

function holdMinutesLeft(holdExpiresAtISO: string | null) {
  if (!holdExpiresAtISO) return null;
  const ms = new Date(holdExpiresAtISO).getTime() - Date.now();
  return ms > 0 ? Math.ceil(ms / 60_000) : 0;
}

function SlotPicker({
  staffId,
  serviceId,
  dateISO,
  excludeBookingId,
  onPick,
}: {
  staffId: string;
  serviceId: string;
  dateISO: string;
  excludeBookingId?: string;
  onPick: (startISO: string) => void;
}) {
  const [slots, setSlots] = useState<{ startISO: string; endISO: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAvailableSlots(staffId, serviceId, dateISO, excludeBookingId)
      .then(setSlots)
      .finally(() => setLoading(false));
  }, [staffId, serviceId, dateISO, excludeBookingId]);

  if (loading) return <p className="text-muted-foreground text-sm">Завантаження...</p>;
  if (slots.length === 0)
    return <p className="text-muted-foreground text-sm">Немає вільних слотів на цю дату.</p>;

  return (
    <div className="flex flex-wrap gap-2">
      {slots.map((slot) => (
        <button
          key={slot.startISO}
          type="button"
          onClick={() => onPick(slot.startISO)}
          className="border-input hover:bg-accent/50 rounded-md border px-3 py-1.5 text-sm"
        >
          {formatTime(slot.startISO)}
        </button>
      ))}
    </div>
  );
}

function RescheduleForm({
  staffId,
  booking,
  onDone,
}: {
  staffId: string;
  booking: BookingItem;
  onDone: () => void;
}) {
  const [date, setDate] = useState(booking.slotStartISO.slice(0, 10));
  const [selectedStartISO, setSelectedStartISO] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    rescheduleBooking,
    undefined
  );

  useEffect(() => {
    if (state === undefined) return;
    if (!("error" in state)) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="mt-2 flex flex-col gap-2 border-t pt-2">
      <input type="hidden" name="bookingId" value={booking.id} />
      <input type="hidden" name="slotStartISO" value={selectedStartISO ?? ""} />
      <Input
        type="date"
        value={date}
        onChange={(e) => {
          setDate(e.target.value);
          setSelectedStartISO(null);
        }}
        className="w-48"
      />
      <SlotPicker
        staffId={staffId}
        serviceId={booking.serviceId}
        dateISO={date}
        excludeBookingId={booking.id}
        onPick={setSelectedStartISO}
      />
      {selectedStartISO && (
        <p className="text-sm">
          Новий час: <strong>{formatTime(selectedStartISO)}</strong>
        </p>
      )}
      {state && "error" in state && <p className="text-sm text-destructive">{state.error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending || !selectedStartISO}>
          {pending ? "Збереження..." : "Перенести"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Скасувати
        </Button>
      </div>
    </form>
  );
}

function BookingRow({ staffId, booking }: { staffId: string; booking: BookingItem }) {
  const [rescheduling, setRescheduling] = useState(false);
  const minutesLeft = holdMinutesLeft(booking.holdExpiresAtISO);

  return (
    <li className="rounded-md border px-4 py-3 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">
            {formatTime(booking.slotStartISO)}–{formatTime(booking.slotEndISO)} ·{" "}
            {booking.serviceName}
          </div>
          <div className="text-muted-foreground text-xs">
            {booking.clientName} · {booking.clientPhone} ·{" "}
            {STATUS_LABELS[booking.status] ?? booking.status}
            {booking.status === "PENDING" && minutesLeft !== null && (
              <> · хол ще {minutesLeft} хв</>
            )}
          </div>
        </div>
        {booking.status === "PENDING" && (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => confirmBooking(booking.id)}>
              Підтвердити
            </Button>
            <Button size="sm" variant="ghost" onClick={() => declineBooking(booking.id)}>
              Відхилити
            </Button>
          </div>
        )}
        {booking.status === "CONFIRMED" && (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setRescheduling((v) => !v)}>
              Перенести
            </Button>
            <Button size="sm" variant="ghost" onClick={() => cancelBooking(booking.id)}>
              Скасувати
            </Button>
          </div>
        )}
      </div>
      {rescheduling && (
        <RescheduleForm
          staffId={staffId}
          booking={booking}
          onDone={() => setRescheduling(false)}
        />
      )}
    </li>
  );
}

function ManualAddForm({
  staffId,
  dateISO,
  services,
}: {
  staffId: string;
  dateISO: string;
  services: ServiceItem[];
}) {
  const [open, setOpen] = useState(false);
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [date, setDate] = useState(dateISO);
  const [selectedStartISO, setSelectedStartISO] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createManualBooking,
    undefined
  );

  useEffect(() => {
    if (state && !("error" in state)) {
      setOpen(false);
      setSelectedStartISO(null);
    }
  }, [state]);

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Додати запис вручну
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="manual-service">Послуга</Label>
          <select
            id="manual-service"
            value={serviceId}
            onChange={(e) => {
              setServiceId(e.target.value);
              setSelectedStartISO(null);
            }}
            className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.displayName} ({s.durationMinutes} хв)
              </option>
            ))}
          </select>
        </div>
        <Input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setSelectedStartISO(null);
          }}
          className="w-48"
        />
        {serviceId && (
          <SlotPicker staffId={staffId} serviceId={serviceId} dateISO={date} onPick={setSelectedStartISO} />
        )}
        {selectedStartISO && (
          <p className="text-sm">
            Обраний час: <strong>{formatTime(selectedStartISO)}</strong>
          </p>
        )}
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="serviceId" value={serviceId} />
          <input type="hidden" name="slotStartISO" value={selectedStartISO ?? ""} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="manual-name">Ім&apos;я клієнта</Label>
            <Input id="manual-name" name="clientName" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="manual-phone">Телефон</Label>
            <Input id="manual-phone" name="clientPhone" type="tel" required />
          </div>
          {state && "error" in state && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={pending || !selectedStartISO}>
              {pending ? "Додавання..." : "Додати запис"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Скасувати
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function AdminBookingsPanel({
  staffId,
  dateISO,
  bookings,
  services,
}: {
  staffId: string;
  dateISO: string;
  bookings: BookingItem[];
  services: ServiceItem[];
}) {
  return (
    <div className="flex flex-col gap-6">
      {bookings.length === 0 ? (
        <p className="text-muted-foreground text-sm">На цю дату записів немає.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {bookings.map((b) => (
            <BookingRow key={b.id} staffId={staffId} booking={b} />
          ))}
        </ul>
      )}

      {services.length > 0 && (
        <ManualAddForm staffId={staffId} dateISO={dateISO} services={services} />
      )}
    </div>
  );
}
