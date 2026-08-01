"use client";

import { useActionState } from "react";
import { Sparkles } from "lucide-react";
import { NICHE_PRESETS } from "@/features/onboarding/niche-presets";
import { applyNichePreset, type ActionState } from "@/features/onboarding/actions";

export function NichePresetPicker() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    applyNichePreset,
    undefined
  );

  return (
    <div className="border-primary/20 bg-accent/30 flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="text-primary size-4" />
        <p className="text-sm font-semibold">Швидкий старт</p>
      </div>
      <p className="text-muted-foreground text-sm">
        Оберіть спеціалізацію — ми додамо типові послуги з цінами й тривалістю, які ви зможете
        відредагувати.
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {NICHE_PRESETS.map((preset) => (
          <form action={formAction} key={preset.slug}>
            <input type="hidden" name="presetSlug" value={preset.slug} />
            <button
              type="submit"
              disabled={pending}
              className="border-border hover:border-primary hover:bg-accent/60 flex w-full flex-col items-start gap-0.5 rounded-lg border bg-transparent px-3 py-2.5 text-left transition-colors disabled:opacity-50"
            >
              <span className="text-sm font-semibold">{preset.name}</span>
              <span className="text-muted-foreground text-xs">{preset.description}</span>
            </button>
          </form>
        ))}
      </div>

      {state && "error" in state && <p className="text-destructive text-sm">{state.error}</p>}
      {state && "added" in state && (
        <p className="text-primary text-sm font-medium">
          {state.added > 0
            ? `Додано послуг: ${state.added}. Відредагуйте ціни за потреби.`
            : "Ці послуги вже є у вашому списку."}
        </p>
      )}
    </div>
  );
}
