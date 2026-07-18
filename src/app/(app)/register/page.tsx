import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "@/features/booking/components/register-form";

export default function RegisterPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden p-8">
      <div
        aria-hidden
        className="from-accent/60 via-background to-background pointer-events-none absolute inset-0 bg-gradient-to-b"
      />
      <Link
        href="/"
        className="font-heading relative flex items-center gap-1.5 text-2xl font-bold"
      >
        <Sparkles className="text-primary size-6" strokeWidth={2.25} />
        BlissTime
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
