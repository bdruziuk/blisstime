import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhyUs } from "@/features/landing/components/WhyUs";
import { getCatalogCombos } from "@/features/catalog/queries";

export default async function HomePage() {
  const combos = (await getCatalogCombos()).slice(0, 8);

  return (
    <main className="flex flex-col">
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="from-accent/60 via-background to-background pointer-events-none absolute inset-0 bg-gradient-to-b"
        />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-7 px-6 py-28 text-center sm:py-36">
          <div className="bg-accent text-accent-foreground inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
            <Sparkles className="size-3.5" />
            Кабінет для майстрів краси
          </div>
          <h1 className="font-heading text-5xl font-bold text-balance sm:text-6xl">
            Запишись за 10 секунд,
            <br className="hidden sm:block" /> без дзвінків і застосунків
          </h1>
          <p className="text-muted-foreground max-w-xl text-lg text-balance">
            BlissTime — кабінет для соло-майстрів і невеликих команд краси: клієнти записуються
            самі, а ви керуєте розкладом в одному місці.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              render={<Link href="/register" />}
              nativeButton={false}
              size="lg"
              className="group h-12 gap-2 rounded-full bg-gradient-to-b from-primary to-primary/85 px-7 text-base font-semibold shadow-lg shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/35 active:translate-y-0"
            >
              Створити кабінет майстра
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Button>
            <Button
              render={<Link href="/login" />}
              nativeButton={false}
              size="lg"
              variant="outline"
              className="h-12 rounded-full border-2 px-7 text-base font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:text-primary hover:shadow-md active:translate-y-0"
            >
              Увійти
            </Button>
          </div>
          <Link href="/search" className="text-muted-foreground hover:text-primary text-sm underline underline-offset-4">
            Шукаєте майстра? Знайти поруч →
          </Link>
        </div>
      </section>

      <WhyUs />

      {combos.length > 0 && (
        <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-3 px-6 pb-20 text-center">
          <p className="text-muted-foreground text-sm font-medium">Популярні категорії</p>
          <div className="flex flex-wrap justify-center gap-2">
            {combos.map((c) => (
              <Link
                key={`${c.citySlug}/${c.categorySlug}`}
                href={`/${c.citySlug}/${c.categorySlug}`}
                className="border-border hover:border-primary hover:text-primary rounded-full border px-3 py-1.5 text-sm transition-colors"
              >
                {c.categoryName} — {c.city}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
