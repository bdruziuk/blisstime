import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Search as SearchIcon,
  Wand2,
  CalendarCheck,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WhyUs } from "@/features/landing/components/WhyUs";
import { VERTICALS } from "@/features/landing/verticals";
import {
  getVerticalCounts,
  getLandingStats,
  type LandingStats,
} from "@/features/landing/queries";

// ISR — the build never depends on the DB (queries degrade to empty).
export const revalidate = 3600;

type LandingData = {
  counts: Map<string, number>;
  stats: LandingStats;
};

async function loadLanding(): Promise<LandingData> {
  try {
    const [counts, stats] = await Promise.all([getVerticalCounts(), getLandingStats()]);
    return { counts, stats };
  } catch {
    return { counts: new Map(), stats: { masters: 0, completedBookings: 0, cities: 0 } };
  }
}

const HOW_IT_WORKS = [
  {
    icon: Wand2,
    title: "Миттєвий імпорт прайсу",
    body: "Вставте звичайний текст прайсу — ШІ розпізнає його й сам сформує послуги з цінами й тривалістю.",
  },
  {
    icon: CalendarCheck,
    title: "Розумний календар",
    body: "Заявки фіксуються миттєво, підтвердження — одним дотиком у Telegram. Жодних перетинів і подвійних записів.",
  },
  {
    icon: MessageCircle,
    title: "AI-Камбекер",
    body: "Система сама нагадує клієнту, що час на повторний візит, і повертає його на новий сеанс.",
  },
];

export default async function HomePage() {
  const { counts, stats } = await loadLanding();

  const statTiles = [
    stats.masters > 0 ? { value: stats.masters, label: "майстрів на платформі" } : null,
    stats.completedBookings > 0 ? { value: stats.completedBookings, label: "виконаних записів" } : null,
    stats.cities > 0 ? { value: stats.cities, label: "міст" } : null,
  ].filter((t): t is { value: number; label: string } => t !== null);

  return (
    <main className="flex flex-col">
      {/* Block 1 — Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="from-accent/60 via-background to-background pointer-events-none absolute inset-0 bg-gradient-to-b"
        />
        <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-8 px-6 py-20 text-center sm:py-28">
          <div className="bg-accent text-accent-foreground inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
            <Sparkles className="size-3.5" />
            Маркетплейс послуг + легка CRM
          </div>
          <h1 className="font-heading text-4xl font-bold text-balance sm:text-6xl">
            Знайдіть свого майстра. Створіть свій бізнес.{" "}
            <span className="text-primary">В один клік.</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg text-balance">
            Сучасний маркетплейс послуг та проста CRM для майстрів і салонів краси. Запускайте
            роботу за 60 секунд із розумним ШІ-помічником.
          </p>

          <div className="grid w-full gap-4 pt-2 text-left sm:grid-cols-2">
            {/* Client side */}
            <div className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-5 shadow-sm">
              <p className="text-sm font-semibold">Шукаю послугу</p>
              <form action="/search" method="GET" className="flex flex-col gap-2">
                <Input name="city" placeholder="Ваше місто, напр. Київ" />
                <Button type="submit" className="group gap-2">
                  <SearchIcon className="size-4" />
                  Знайти вільні слоти
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </form>
            </div>
            {/* Business side */}
            <div className="border-primary/30 bg-accent/30 flex flex-col gap-3 rounded-2xl border p-5 shadow-sm">
              <p className="text-sm font-semibold">Маю справу</p>
              <p className="text-muted-foreground text-sm">
                Вставите прайс — ШІ збере ваш кабінет за секунди. Перші 30 записів щомісяця
                безкоштовні.
              </p>
              <Button
                render={<Link href="/register" />}
                nativeButton={false}
                className="group mt-auto gap-2 bg-gradient-to-b from-primary to-primary/85"
              >
                Створити кабінет за 5 сек
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Block 2 — Verticals grid */}
      <section className="mx-auto w-full max-w-5xl px-6 py-16">
        <h2 className="font-heading mb-6 text-center text-2xl font-bold sm:text-3xl">
          Чим ми займаємось
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {VERTICALS.map((v) => {
            const count = counts.get(v.slug) ?? 0;
            return (
              <Link
                key={v.slug}
                href={`/search?category=${v.slug}`}
                className="bg-primary text-primary-foreground hover:bg-primary-hover card-hover flex flex-col gap-1.5 rounded-2xl p-4"
              >
                <span className="font-heading text-base font-bold">{v.name}</span>
                <span className="text-primary-foreground/80 text-xs">{v.blurb}</span>
                {count > 0 && (
                  <span className="text-primary-foreground/90 mt-1 text-xs font-semibold">
                    {count}{" "}
                    {count === 1 ? "майстер" : count < 5 ? "майстри" : "майстрів"}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Block 3 — How it works */}
      <section className="bg-accent/20 border-y">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <h2 className="font-heading mb-8 text-center text-2xl font-bold sm:text-3xl">
            Як це працює для бізнесу
          </h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.title} className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-5">
                <div className="flex items-center gap-3">
                  <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-full font-bold">
                    {i + 1}
                  </span>
                  <step.icon className="text-primary size-5" />
                </div>
                <p className="font-heading font-bold">{step.title}</p>
                <p className="text-muted-foreground text-sm">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WhyUs />

      {/* Block 5 — Social proof (real stats only) */}
      {statTiles.length > 0 && (
        <section className="bg-accent/20 border-y">
          <div className="mx-auto w-full max-w-5xl px-6 py-16">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {statTiles.map((t) => (
                <div key={t.label} className="text-center">
                  <div className="font-heading text-primary text-3xl font-bold">{t.value}</div>
                  <div className="text-muted-foreground text-sm">{t.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Block 6 — Final CTA */}
      <section className="mx-auto w-full max-w-3xl px-6 py-20 text-center">
        <div className="from-primary to-primary/85 text-primary-foreground flex flex-col items-center gap-4 rounded-3xl bg-gradient-to-b p-10 shadow-lg">
          <h2 className="font-heading text-2xl font-bold text-balance sm:text-3xl">
            Спробуйте EasyService безкоштовно
          </h2>
          <p className="max-w-lg text-balance opacity-90">
            Перші 30 записів щомісяця — назавжди безкоштовні. Карта не потрібна.
          </p>
          <Button
            render={<Link href="/register" />}
            nativeButton={false}
            size="lg"
            variant="secondary"
            className="group mt-2 gap-2 rounded-full font-semibold"
          >
            Почати тест
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </section>
    </main>
  );
}
