import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "@/features/booking/components/register-form";
import { PublicHeader } from "@/features/landing/components/public-header";
import { auth } from "@/lib/auth";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ claim?: string }> }) {
  const [{ claim }, session] = await Promise.all([searchParams, auth()]);
  return (
    <>
      <PublicHeader user={session?.user ? { name: session.user.name ?? null, email: session.user.email ?? null } : null} />
      <main className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-6 overflow-hidden p-8">
      <div
        aria-hidden
        className="from-accent/60 via-background to-background pointer-events-none absolute inset-0 bg-gradient-to-b"
      />
      <Card className="relative w-full max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Реєстрація майстра</CardTitle>
        </CardHeader>
        <CardContent>
          <RegisterForm claimToken={claim} />
        </CardContent>
      </Card>
      </main>
    </>
  );
}
