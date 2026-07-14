"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerStaff, type ActionState } from "@/features/booking/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    registerStaff,
    undefined
  );

  return (
    <>
      <form action={formAction} className="flex flex-col gap-4">
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
        <Button type="submit" disabled={pending}>
          {pending ? "Реєстрація..." : "Зареєструватися"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        Вже маєте акаунт?{" "}
        <Link href="/login" className="underline">
          Увійти
        </Link>
      </p>
    </>
  );
}
