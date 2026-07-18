"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginStaff, type ActionState } from "@/features/booking/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    loginStaff,
    undefined
  );

  return (
    <>
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Пароль</Label>
          <Input id="password" name="password" type="password" required />
        </div>
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button
          type="submit"
          disabled={pending}
          className="h-11 rounded-full bg-gradient-to-b from-primary to-primary/85 text-base font-semibold shadow-lg shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/35 active:translate-y-0"
        >
          {pending ? "Вхід..." : "Увійти"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        Ще немає акаунту?{" "}
        <Link href="/register" className="text-primary font-semibold hover:underline">
          Зареєструватися
        </Link>
      </p>
    </>
  );
}
