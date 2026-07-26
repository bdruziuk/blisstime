"use client";

import { useState, useTransition } from "react";
import { Send, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateTelegramLink, disconnectTelegram } from "@/features/telegram/actions";

export function TelegramConnect({ connected }: { connected: boolean }) {
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (connected) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-primary flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="size-4" />
          Telegram підключено — заявки й нагадування надходять у бот.
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => startTransition(() => disconnectTelegram())}
          className="self-start"
        >
          Відключити
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">
        Підключіть Telegram, щоб підтверджувати нові заявки одним дотиком і отримувати нагадування
        про візити.
      </p>

      {linkUrl ? (
        <div className="flex flex-col gap-2">
          <Button
            render={<a href={linkUrl} target="_blank" rel="noopener noreferrer" />}
            nativeButton={false}
            className="gap-2"
          >
            <Send className="size-4" />
            Відкрити бот і підтвердити
            <ExternalLink className="size-3.5" />
          </Button>
          <p className="text-muted-foreground text-xs">
            Відкриється чат з ботом — натисніть «Start». Потім оновіть цю сторінку.
          </p>
        </div>
      ) : (
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const { url } = await generateTelegramLink();
              setLinkUrl(url);
            })
          }
          className="gap-2 self-start"
        >
          <Send className="size-4" />
          {pending ? "Генеруємо..." : "Підключити Telegram"}
        </Button>
      )}
    </div>
  );
}
