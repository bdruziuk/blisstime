import { PublicHeader } from "@/features/landing/components/public-header";
import { auth } from "@/lib/auth";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <>
      <PublicHeader user={session?.user ? { name: session.user.name ?? null, email: session.user.email ?? null } : null} />
      {children}
    </>
  );
}
