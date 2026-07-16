import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "@/features/booking/components/register-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <Link href="/" className="font-heading text-2xl font-semibold">
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
