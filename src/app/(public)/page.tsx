import Link from "next/link";
import { Zap, Search, Heart, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  {
    icon: Zap,
    title: "Запис за 10 секунд",
    body: "Клієнтка бронює послугу у браузері з лінка в Instagram — без застосунку, без реєстрації, без переписки в Direct.",
  },
  {
    icon: Search,
    title: "Клієнти з Google — безкоштовно",
    body: "Ваша сторінка потрапляє в каталог і індексується пошуковими системами. Платите за кабінет — трафік з Google отримуєте безкоштовно.",
  },
  {
    icon: Heart,
    title: "Ті, що були — повертаються",
    body: "Нагадування, рейтинг надійності клієнтів і керування розкладом заощаджують ваш час і рятують дохід від no-show.",
  },
];

export default function HomePage() {
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
              className="h-11 gap-2 rounded-full px-6 text-base"
            >
              Створити кабінет майстра
              <ArrowRight className="size-4" />
            </Button>
            <Button
              render={<Link href="/login" />}
              nativeButton={false}
              size="lg"
              variant="outline"
              className="h-11 rounded-full px-6 text-base"
            >
              Увійти
            </Button>
          </div>
        </div>
      </section>

      <section className="border-border border-t">
        <div className="mx-auto grid max-w-4xl gap-5 px-6 py-16 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="card-hover">
              <CardContent className="flex flex-col gap-3">
                <div className="bg-accent text-accent-foreground flex size-10 items-center justify-center rounded-lg">
                  <f.icon className="size-5" strokeWidth={2.25} />
                </div>
                <h2 className="font-heading text-base font-bold">{f.title}</h2>
                <p className="text-muted-foreground text-sm">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
