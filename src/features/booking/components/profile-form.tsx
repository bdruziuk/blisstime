"use client";

import { useActionState } from "react";
import { updateProfile, type ActionState } from "@/features/booking/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({
  defaultDisplayName,
  defaultUsername,
  defaultBio,
}: {
  defaultDisplayName: string;
  defaultUsername: string;
  defaultBio: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateProfile,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="displayName">Ім&apos;я, яке бачитимуть клієнти</Label>
        <Input id="displayName" name="displayName" defaultValue={defaultDisplayName} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="username">Username (для посилання /@username)</Label>
        <Input id="username" name="username" defaultValue={defaultUsername} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bio">Про себе</Label>
        <Input id="bio" name="bio" defaultValue={defaultBio} />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Збереження..." : "Далі"}
      </Button>
    </form>
  );
}
