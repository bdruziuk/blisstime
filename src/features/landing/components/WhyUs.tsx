import Link from "next/link";
import { Search, Zap, RefreshCw, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const WHY_US_ITEMS = [
  {
    icon: Search,
    title: "Клієнти знаходять тебе самі",
    body: "Твоя сторінка потрапляє в каталог і ранжується в Google. Люди, які шукають «манікюр + твій район», приходять до тебе — без реклами і розкруток.",
  },
  {
    icon: Zap,
    title: "Запис за 10 секунд, без застосунків",
    body: "Клієнтка переходить з Instagram і записується одразу в браузері. Без завантажень, реєстрацій і переписок у Direct.",
  },
  {
    icon: RefreshCw,
    title: "Клієнти повертаються самі",
    body: "Система пам'ятає, коли клієнтка була востаннє, і вчасно нагадує їй, що пора оновити манікюр чи брови — з лінком на вільні слоти.",
  },
  {
    icon: ShieldCheck,
    title: "Ти контролюєш свій графік",
    body: "Кожен запис підтверджуєш одним дотиком у Telegram. А передоплату система попросить лише в нових чи ненадійних клієнток — постійні записуються без бар'єрів.",
  },
] as const;

const SECTION_TITLE = "Чому майстри обирають нас";
const CTA_LABEL = "Створити кабінет безкоштовно";

export function WhyUs() {
  return (
    <section id="why-us" className="border-border border-t">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-10 px-6 py-16 sm:py-20">
        <h2 className="font-heading text-center text-3xl font-bold text-balance sm:text-4xl">
          {SECTION_TITLE}
        </h2>

        <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2">
          {WHY_US_ITEMS.map((item) => (
            <Card key={item.title} className="card-hover">
              <CardContent className="flex flex-col gap-3">
                <div className="bg-accent text-accent-foreground flex size-10 items-center justify-center rounded-lg">
                  <item.icon className="size-5" strokeWidth={2.25} />
                </div>
                <h3 className="font-heading text-base font-bold">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button
          render={<Link href="/register" />}
          nativeButton={false}
          size="lg"
          className="group h-12 gap-2 rounded-full bg-gradient-to-b from-primary to-primary/85 px-7 text-base font-semibold shadow-lg shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/35 active:translate-y-0"
        >
          {CTA_LABEL}
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Button>
      </div>
    </section>
  );
}
