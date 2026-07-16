import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "@/features/booking/components/register-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <Link href="/" className="font-heading flex items-center gap-1.5 text-2xl font-bold">
        <Sparkles className="text-primary size-6" strokeWidth={2.25} />
        BlissTime
      </Link>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Реєстрація майстра</CardTitle>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
    </main>
  );
}
