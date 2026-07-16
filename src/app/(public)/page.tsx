import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  {
    title: "Запис за 10 секунд",
    body: "Клієнтка бронює послугу у браузері з лінка в Instagram — без застосунку, без реєстрації, без переписки в Direct.",
  },
  {
    title: "Клієнти з Google — безкоштовно",
    body: "Ваша сторінка потрапляє в каталог і індексується пошуковими системами. Платите за кабінет — трафік з Google отримуєте безкоштовно.",
  },
  {
    title: "Ті, що були — повертаються",
    body: "Нагадування, рейтинг надійності клієнтів і керування розкладом заощаджують ваш час і рятують дохід від no-show.",
  },
];

export default function HomePage() {
  return (
    <main className="flex flex-col">
      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-24 text-center">
        <h1 className="font-heading text-4xl font-semibold text-balance sm:text-5xl">
          Запишись за 10 секунд, без дзвінків і застосунків
        </h1>
        <p className="text-muted-foreground max-w-xl text-lg text-balance">
          BlissTime — кабінет для соло-майстрів і невеликих команд краси: клієнти записуються
          самі, а ви керуєте розкладом в одному місці.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button render={<Link href="/register" />} size="lg">
            Створити кабінет майстра
          </Button>
          <Button render={<Link href="/login" />} size="lg" variant="outline">
            Увійти
          </Button>
        </div>
      </section>

      <section className="border-border bg-card/40 border-y">
        <div className="mx-auto grid max-w-4xl gap-6 px-6 py-16 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="bg-transparent shadow-none">
              <CardContent className="p-0">
                <h2 className="font-heading text-lg font-semibold">{f.title}</h2>
                <p className="text-muted-foreground mt-2 text-sm">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
