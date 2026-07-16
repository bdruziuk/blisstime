export const STATUS_LABELS: Record<string, string> = {
  PENDING: "Очікує підтвердження",
  CONFIRMED: "Підтверджено",
  DECLINED: "Відхилено",
  EXPIRED: "Хол минув",
  COMPLETED: "Завершено",
  CANCELLED: "Скасовано",
  NO_SHOW: "Не прийшов",
};

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Kyiv",
  });
}

const DATE_LABEL_FORMATTER = new Intl.DateTimeFormat("uk-UA", {
  timeZone: "Europe/Kyiv",
  day: "numeric",
  month: "long",
  weekday: "short",
});

export function formatDateLabel(dateISO: string) {
  return DATE_LABEL_FORMATTER.format(new Date(`${dateISO}T12:00:00Z`));
}
