"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { saveClientNote, type NoteState } from "@/features/crm/actions";

export function ClientNoteForm({ clientId, note }: { clientId: string; note: string }) {
  const [state, formAction, pending] = useActionState<NoteState, FormData>(
    saveClientNote,
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="clientId" value={clientId} />
      <textarea
        name="body"
        defaultValue={note}
        rows={4}
        placeholder="Нотатки про клієнта: уподобання, алергії, деталі…"
        className="border-input w-full rounded-md border bg-transparent p-2 text-sm shadow-xs"
      />
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Збереження..." : "Зберегти нотатку"}
        </Button>
        {state && "saved" in state && <span className="text-primary text-xs">Збережено ✓</span>}
        {state && "error" in state && <span className="text-destructive text-xs">{state.error}</span>}
      </div>
    </form>
  );
}
