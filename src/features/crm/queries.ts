import { prisma } from "@/lib/prisma";

export type ClientListItem = {
  id: string;
  name: string | null;
  phone: string;
  reliabilityScore: number;
  noShowCount: number;
  totalBookings: number;
  completedVisits: number;
  lastVisit: Date | null;
  hasNote: boolean;
};

/** Clients who have ever booked with this staff, with per-client aggregates. */
export async function getClientsForStaff(staffId: string): Promise<ClientListItem[]> {
  const [bookings, notes] = await Promise.all([
    prisma.booking.findMany({
      where: { staffId },
      select: {
        status: true,
        slotStart: true,
        client: {
          select: { id: true, name: true, phone: true, reliabilityScore: true, noShowCount: true },
        },
      },
      orderBy: { slotStart: "desc" },
    }),
    prisma.clientNote.findMany({ where: { staffId }, select: { clientId: true } }),
  ]);

  const notedClientIds = new Set(notes.map((n) => n.clientId));
  const byClient = new Map<string, ClientListItem>();

  for (const b of bookings) {
    const c = b.client;
    const entry =
      byClient.get(c.id) ??
      {
        id: c.id,
        name: c.name,
        phone: c.phone,
        reliabilityScore: c.reliabilityScore,
        noShowCount: c.noShowCount,
        totalBookings: 0,
        completedVisits: 0,
        lastVisit: null as Date | null,
        hasNote: notedClientIds.has(c.id),
      };
    entry.totalBookings += 1;
    if (b.status === "COMPLETED") {
      entry.completedVisits += 1;
      if (!entry.lastVisit || b.slotStart > entry.lastVisit) entry.lastVisit = b.slotStart;
    }
    byClient.set(c.id, entry);
  }

  // Most recently active first (bookings were ordered desc, so first-seen wins).
  return [...byClient.values()];
}

export type ClientVisit = {
  id: string;
  status: string;
  slotStart: Date;
  serviceNames: string;
};

export type ClientDetail = {
  id: string;
  name: string | null;
  phone: string;
  reliabilityScore: number;
  noShowCount: number;
  lateCancellationCount: number;
  telegramLinked: boolean;
  note: string;
  visits: ClientVisit[];
};

/** Full client card for this staff: info, reliability, visit history, and the note. */
export async function getClientDetail(
  staffId: string,
  clientId: string
): Promise<ClientDetail | null> {
  const bookings = await prisma.booking.findMany({
    where: { staffId, clientId },
    include: { services: { include: { service: true } }, service: true },
    orderBy: { slotStart: "desc" },
  });
  // Only expose clients who actually booked with this staff.
  if (bookings.length === 0) return null;

  const [client, note] = await Promise.all([
    prisma.client.findUnique({ where: { id: clientId } }),
    prisma.clientNote.findUnique({ where: { staffId_clientId: { staffId, clientId } } }),
  ]);
  if (!client) return null;

  return {
    id: client.id,
    name: client.name,
    phone: client.phone,
    reliabilityScore: client.reliabilityScore,
    noShowCount: client.noShowCount,
    lateCancellationCount: client.lateCancellationCount,
    telegramLinked: Boolean(client.telegramChatId),
    note: note?.body ?? "",
    visits: bookings.map((b) => ({
      id: b.id,
      status: b.status,
      slotStart: b.slotStart,
      serviceNames:
        b.services.length > 0
          ? b.services.map((s) => s.service.displayName).join(" + ")
          : b.service.displayName,
    })),
  };
}
