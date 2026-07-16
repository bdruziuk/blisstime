import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/features/booking/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <Link href="/" className="font-heading text-2xl font-semibold">
        BlissTime
      </Link>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Вхід</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
