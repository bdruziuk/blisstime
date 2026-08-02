"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerStaff, type ActionState } from "@/features/booking/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm({ claimToken }: { claimToken?: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    registerStaff,
    undefined
  );

  return (
    <>
      <form action={formAction} className="flex flex-col gap-4">
        {claimToken && <input type="hidden" name="claimToken" value={claimToken} />}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Ім&apos;я</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Пароль</Label>
          <Input id="password" name="password" type="password" required minLength={8} />
        </div>
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button
          type="submit"
          disabled={pending}
          className="h-11 rounded-full bg-gradient-to-b from-primary to-primary/85 text-base font-semibold shadow-lg shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/35 active:translate-y-0"
        >
          {pending ? "Реєстрація..." : "Зареєструватися"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        Вже маєте акаунт?{" "}
        <Link href="/login" className="text-primary font-semibold hover:underline">
          Увійти
        </Link>
      </p>
    </>
  );
}
