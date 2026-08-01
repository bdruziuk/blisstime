import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdminEmail } from "@/lib/super-admin";
import { SiteHeader } from "@/components/site-header";
import { BusinessImportPanel } from "@/features/business-import/components/business-import-panel";
import { BEAUTY_IMPORT_CATEGORIES } from "@/features/business-import/config/categories";

export default async function BusinessImportPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });
  if (!user || !isSuperAdminEmail(user.email)) redirect("/admin");

  return (
    <>
      <SiteHeader />
      <BusinessImportPanel categories={BEAUTY_IMPORT_CATEGORIES.map((item) => ({ ...item, providerTypes: [...item.providerTypes], searchQueries: [...item.searchQueries] }))} />
    </>
  );
}
