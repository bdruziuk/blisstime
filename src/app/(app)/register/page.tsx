import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "@/features/booking/components/register-form";
import { Logo } from "@/components/logo";

export default function RegisterPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden p-8">
      <div
        aria-hidden
        className="from-accent/60 via-background to-background pointer-events-none absolute inset-0 bg-gradient-to-b"
      />
      <Link href="/" className="relative">
        <Logo className="text-2xl" />
      </Link>
      <Card className="relative w-full max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Реєстрація майстра</CardTitle>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
    </main>
  );
}
