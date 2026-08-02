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
  const query = (url.searchParams.get("query") ?? "").trim().toLocaleLowerCase().slice(0, 100);
  const [imported, manual] = await Promise.all([
    filter === "manual" ? [] : prisma.importedBusiness.findMany({ select: { id: true, name: true, formattedAddress: true, city: true, publicationStatus: true, ownerClaimToken: true, claimedByStaffId: true, claimedByStaff: { select: { displayName: true, user: { select: { email: true } } } } } }),
    filter === "imported_unowned" || filter === "imported_owned" ? [] : prisma.staff.findMany({ where: { onboardedAt: { not: null }, claimedImportedBusiness: null }, select: { id: true, userId: true, displayName: true, user: { select: { email: true } }, location: { select: { address: true, city: true, organization: { select: { name: true } } } } } }),
  ]);
  let items = [
    ...imported.filter((item) => filter === "all" || (filter === "imported_owned" ? item.claimedByStaffId : !item.claimedByStaffId)).map((item) => ({ id: item.id, deleteId: item.id, kind: item.claimedByStaffId ? "imported_owned" : "imported_unowned", name: item.name, address: item.formattedAddress, city: item.city, owner: item.claimedByStaff ? item.claimedByStaff.displayName || item.claimedByStaff.user.email : null, claimToken: item.ownerClaimToken, publicationStatus: item.publicationStatus })),
    ...manual.map((item) => ({ id: item.id, deleteId: item.userId, kind: "manual", name: item.location.organization.name || item.displayName, address: item.location.address, city: item.location.city, owner: item.displayName || item.user.email, claimToken: null, publicationStatus: "PUBLISHED" })),
  ].sort((a, b) => a.name.localeCompare(b.name, "uk"));
  if (query) items = items.filter((item) => item.name.toLocaleLowerCase().includes(query));
  const total = items.length;
  items = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  for (const item of items) {
    if (item.kind === "imported_unowned" && !item.claimToken) {
      const token = randomUUID();
      await prisma.importedBusiness.update({ where: { id: item.id }, data: { ownerClaimToken: token } });
      item.claimToken = token;
    }
  }
  return NextResponse.json({ items: items.map((item) => ({ ...item, claimUrl: item.claimToken ? `${SITE_URL}/register?claim=${item.claimToken}` : null })), total, hasMore: (page + 1) * PAGE_SIZE < total });
}
