import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Search as SearchIcon,
  Wand2,
  CalendarCheck,
  MessageCircle,
  Star,
  MapPin,
  Map as MapIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WhyUs } from "@/features/landing/components/WhyUs";
import { VERTICALS } from "@/features/landing/verticals";
import {
  getVerticalCounts,
  getTopMasters,
  getRecentReviews,
  getLandingStats,
  type TopMaster,
  type LandingReview,
  type LandingStats,
} from "@/features/landing/queries";

// ISR — the build never depends on the DB (queries degrade to empty).
export const revalidate = 3600;

type LandingData = {
  counts: Map<string, number>;
  topMasters: TopMaster[];
  reviews: LandingReview[];
  stats: LandingStats;
};

async function loadLanding(): Promise<LandingData> {
  try {
    const [counts, topMasters, reviews, stats] = await Promise.all([
      getVerticalCounts(),
      getTopMasters(6),
      getRecentReviews(8),
      getLandingStats(),
    ]);
    return { counts, topMasters, reviews, stats };
  } catch {
    return { counts: new Map(), topMasters: [], reviews: [], stats: { masters: 0, completedBookings: 0, cities: 0 } };
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

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={n <= rating ? "fill-primary text-primary size-3.5" : "text-muted-foreground/40 size-3.5"}
        />
      ))}
    </span>
  );
}

export default async function HomePage() {
  const { counts, topMasters, reviews, stats } = await loadLanding();

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
                className="border-border hover:border-primary card-hover flex flex-col gap-1.5 rounded-2xl border p-4"
              >
                <span className="text-2xl">{v.emoji}</span>
                <span className="font-heading text-sm font-bold">{v.name}</span>
                <span className="text-muted-foreground text-xs">{v.blurb}</span>
                {count > 0 && (
                  <span className="text-primary mt-1 text-xs font-semibold">
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

      {/* Block 4 — Top masters + map */}
      {topMasters.length > 0 && (
        <section className="mx-auto w-full max-w-5xl px-6 py-16">
          <h2 className="font-heading mb-6 text-center text-2xl font-bold sm:text-3xl">
            ТОП-майстри
          </h2>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:col-span-2">
              {topMasters.map((m) => (
                <Link
                  key={m.username}
                  href={`/@${m.username}`}
                  className="border-border hover:border-primary card-hover flex flex-col gap-1.5 rounded-2xl border p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-heading truncate font-bold">{m.displayName}</span>
                    <span className="flex shrink-0 items-center gap-1 text-sm font-semibold">
                      <Star className="fill-primary text-primary size-4" />
                      {m.avgRating.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-muted-foreground flex items-center gap-1 text-xs">
                    <MapPin className="size-3.5" />
                    {m.city}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {m.categoryNames.join(" · ")}
                  </p>
                </Link>
              ))}
            </div>
            {/* Map placeholder — real Google Maps once an API key is configured. */}
            <div className="border-border bg-accent/20 flex min-h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-6 text-center">
              <MapIcon className="text-muted-foreground size-8" />
              <p className="text-sm font-medium">Інтерактивна мапа</p>
              <p className="text-muted-foreground text-xs">Незабаром: майстри поблизу на карті</p>
            </div>
          </div>
        </section>
      )}

      {/* Block 5 — Social proof */}
      {(reviews.length > 0 || statTiles.length > 0) && (
        <section className="bg-accent/20 border-y">
          <div className="mx-auto w-full max-w-5xl px-6 py-16">
            {statTiles.length > 0 && (
              <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {statTiles.map((t) => (
                  <div key={t.label} className="text-center">
                    <div className="font-heading text-primary text-3xl font-bold">{t.value}</div>
                    <div className="text-muted-foreground text-sm">{t.label}</div>
                  </div>
                ))}
              </div>
            )}
            {reviews.length > 0 && (
              <>
                <h2 className="font-heading mb-6 text-center text-2xl font-bold sm:text-3xl">
                  Що кажуть клієнти
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {reviews.slice(0, 6).map((r) => (
                    <div key={r.id} className="border-border bg-card flex flex-col gap-2 rounded-2xl border p-4">
                      <Stars rating={r.rating} />
                      <p className="text-sm">{r.comment}</p>
                      <p className="text-muted-foreground mt-auto text-xs">
                        {r.clientName ?? "Клієнт"} про{" "}
                        <Link href={`/@${r.masterUsername}`} className="hover:text-primary underline underline-offset-2">
                          {r.masterName}
                        </Link>{" "}
                        · {r.serviceName}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
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
