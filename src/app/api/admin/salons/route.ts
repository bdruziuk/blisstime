import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSuperAdminUser } from "@/features/business-import/admin-auth";
import { unauthorized } from "@/features/business-import/api-response";
import { SITE_URL } from "@/lib/site-url";

const PAGE_SIZE = 50;

export async function GET(request: Request) {
  if (!(await getSuperAdminUser())) return unauthorized();
  const url = new URL(request.url);
  const page = Math.max(0, Number(url.searchParams.get("page") ?? 0) || 0);
  const filter = url.searchParams.get("filter") ?? "all";
  const visibility = url.searchParams.get("visibility") ?? "all";
  const city = (url.searchParams.get("city") ?? "").trim();
  const query = (url.searchParams.get("query") ?? "").trim().toLocaleLowerCase().slice(0, 100);

  const staffDetails = {
    displayName: true,
    username: true,
    telegramChatId: true,
    confirmationMode: true,
    user: { select: { email: true } },
    services: { select: { isActive: true } },
    bookings: { select: { clientId: true } },
  } as const;
  const [imported, manual] = await Promise.all([
    filter === "manual" ? [] : prisma.importedBusiness.findMany({
      select: {
        id: true, name: true, formattedAddress: true, city: true, publicationStatus: true,
        ownerClaimToken: true, claimedByStaffId: true, nationalPhone: true, internationalPhone: true,
        rating: true, userRatingCount: true, updatedAt: true,
        claimedByStaff: { select: staffDetails },
        _count: { select: { serviceDrafts: { where: { status: "APPROVED" } } } },
      },
    }),
    filter === "imported_unowned" || filter === "imported_owned" ? [] : prisma.staff.findMany({
      where: { onboardedAt: { not: null }, claimedImportedBusiness: null },
      select: {
        id: true, userId: true, displayName: true, username: true, isPublished: true,
        telegramChatId: true, confirmationMode: true, updatedAt: true,
        user: { select: { email: true } },
        services: { select: { isActive: true } },
        bookings: { select: { clientId: true } },
        location: { select: { address: true, city: true, organization: { select: { name: true, type: true } } } },
      },
    }),
  ]);

  const metrics = (staff: { telegramChatId: string | null; confirmationMode: string; username: string; services: { isActive: boolean }[]; bookings: { clientId: string }[] } | null) => ({
    telegramConnected: staff ? Boolean(staff.telegramChatId) : null,
    confirmationMode: staff?.confirmationMode ?? null,
    clientCount: staff ? new Set(staff.bookings.map((booking) => booking.clientId)).size : 0,
    bookingCount: staff?.bookings.length ?? 0,
    serviceCount: staff?.services.length ?? 0,
    activeServiceCount: staff?.services.filter((service) => service.isActive).length ?? 0,
    publicProfileUrl: staff ? `${SITE_URL}/@${staff.username}` : null,
  });

  let items = [
    ...imported
      .filter((item) => filter === "all" || (filter === "imported_owned" ? item.claimedByStaffId : !item.claimedByStaffId))
      .map((item) => ({
        id: item.id,
        deleteId: item.id,
        kind: item.claimedByStaffId ? "imported_owned" as const : "imported_unowned" as const,
        name: item.name,
        address: item.formattedAddress,
        city: item.city,
        owner: item.claimedByStaff ? item.claimedByStaff.displayName || item.claimedByStaff.user.email : null,
        ownerEmail: item.claimedByStaff?.user.email ?? null,
        claimToken: item.ownerClaimToken,
        publicationStatus: item.publicationStatus,
        phone: item.internationalPhone || item.nationalPhone,
        rating: item.rating,
        userRatingCount: item.userRatingCount,
        importedServiceCount: item._count.serviceDrafts,
        organizationType: "SALON",
        updatedAt: item.updatedAt,
        ...metrics(item.claimedByStaff),
      })),
    ...manual.map((item) => ({
      id: item.id,
      deleteId: item.userId,
      kind: "manual" as const,
      name: item.location.organization.name || item.displayName,
      address: item.location.address,
      city: item.location.city,
      owner: item.displayName || item.user.email,
      ownerEmail: item.user.email,
      claimToken: null,
      publicationStatus: item.isPublished ? "PUBLISHED" : "REJECTED",
      phone: null,
      rating: null,
      userRatingCount: null,
      importedServiceCount: 0,
      organizationType: item.location.organization.type,
      updatedAt: item.updatedAt,
      ...metrics(item),
    })),
  ].sort((a, b) => a.name.localeCompare(b.name, "uk"));

  const cities = [...new Set(items.map((item) => item.city).filter(Boolean))].sort((a, b) => a.localeCompare(b, "uk"));
  if (query) items = items.filter((item) => item.name.toLocaleLowerCase().includes(query));
  if (city) items = items.filter((item) => item.city.toLocaleLowerCase() === city.toLocaleLowerCase());
  if (visibility === "published") items = items.filter((item) => item.publicationStatus === "PUBLISHED");
  if (visibility === "unpublished") items = items.filter((item) => item.publicationStatus !== "PUBLISHED");
  if (visibility === "pending") items = items.filter((item) => item.publicationStatus === "IMPORT_PENDING_REVIEW");
  if (visibility === "rejected") items = items.filter((item) => item.publicationStatus === "REJECTED");
  if (visibility === "without_services") items = items.filter((item) =>
    item.kind === "imported_unowned" ? item.importedServiceCount === 0 : item.activeServiceCount === 0
  );
  const total = items.length;
  items = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  for (const item of items) {
    if (item.kind === "imported_unowned" && !item.claimToken) {
      const token = randomUUID();
      await prisma.importedBusiness.update({ where: { id: item.id }, data: { ownerClaimToken: token } });
      item.claimToken = token;
    }
  }
  return NextResponse.json({
    items: items.map((item) => ({ ...item, claimUrl: item.claimToken ? `${SITE_URL}/register?claim=${item.claimToken}` : null })),
    total,
    cities,
    hasMore: (page + 1) * PAGE_SIZE < total,
  });
}
