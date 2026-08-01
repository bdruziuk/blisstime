# EasyService

EasyService — українська web-first платформа для beauty-майстрів і їхніх клієнтів. Репозиторій має робочу назву **BlissTime**.

Продукт поєднує:

- кабінет майстра з календарем, послугами, CRM, доходами та Telegram-сповіщеннями;
- публічний каталог із пошуком, SEO-сторінками та записом без реєстрації;
- AI-імпорт прайс-листа у структуровані послуги.

## Технології

- Next.js 15 App Router, React 19, TypeScript;
- Tailwind CSS 4, shadcn/ui та Base UI;
- PostgreSQL, Prisma 7;
- Auth.js 5 з email/password;
- Telegram Bot API;
- OpenAI API;
- Vitest для unit-тестів календарної логіки.

## Структура

```text
src/app/(app)       кабінет, реєстрація та onboarding
src/app/(public)    лендінг, каталог, профілі й відгуки
src/app/api         Auth.js, Telegram webhook і worker нагадувань
src/features        бізнес-модулі за функціональністю
src/lib             Prisma, Auth.js, Telegram та спільні утиліти
prisma              схема, міграції та seed
scripts             локальний Telegram polling
```

Кабінет і каталог працюють в одному Next.js застосунку та використовують спільну базу даних.

## Вимоги

- Node.js 20 або новіший;
- npm;
- PostgreSQL із підтримкою розширення `btree_gist`;
- Telegram-бот — опційно для локальної розробки;
- OpenAI API key — опційно для AI-імпорту.

## Локальний запуск

1. Встановіть залежності:

   ```bash
   npm ci
   ```

2. Створіть локальний `.env`:

   ```bash
   cp .env.example .env
   ```

   У PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Заповніть щонайменше `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` і `NEXT_PUBLIC_APP_URL`.

4. Застосуйте міграції та заповніть довідник категорій:

   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

5. Запустіть dev-сервер:

   ```bash
   npm run dev
   ```

Застосунок буде доступний на [http://localhost:3000](http://localhost:3000).

## Змінні середовища

| Змінна | Призначення |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Секрет підпису Auth.js |
| `NEXTAUTH_URL` | Базова URL для Auth.js |
| `NEXT_PUBLIC_APP_URL` | Публічна URL застосунку |
| `SUPER_ADMIN_EMAILS` | Email суперадмінів через кому; надає доступ до `/admin` |
| `TELEGRAM_BOT_TOKEN` | Токен Telegram-бота |
| `TELEGRAM_BOT_USERNAME` | Username бота без `@` |
| `TELEGRAM_WEBHOOK_SECRET` | Перевірка запитів Telegram webhook |
| `CRON_SECRET` | Захист endpoint нагадувань |
| `OPENAI_API_KEY` | AI-імпорт прайс-листа |
| `GOOGLE_PLACES_SERVER_API_KEY` | Серверний ключ Google Places API (New) для імпорту салонів |
| `ALLOW_INDEXING` | Дозволяє індексацію лише за точного значення `true` |

Повний шаблон міститься у `.env.example`. Файл `.env` не можна комітити.

## Команди

```bash
npm run dev          # локальний Next.js із Turbopack
npm run build        # production build
npm run start        # міграції та запуск production-сервера
npm run start:web    # запуск без автоматичних міграцій
npm run lint         # ESLint
npm test             # усі unit-тести один раз
npm run test:watch   # Vitest у watch-режимі
npm run db:seed      # довідник категорій послуг
npm run bot:dev      # Telegram long polling для локальної розробки
```

## База даних і бронювання

Гроші зберігаються як цілі копійки, а часові значення — в UTC. Бізнес-таймзона зараз фіксована як `Europe/Kyiv`.

PostgreSQL exclusion constraint не дозволяє одному майстру мати записи, що перетинаються. Активні `PENDING` hold також блокують слот. Слоти генеруються з кроком 15 хвилин із робочих годин за вирахуванням записів і блокувань графіка.

Не редагуйте вже застосовані міграції. Зміни схеми оформлюйте новою Prisma-міграцією.

## Telegram

У production Telegram надсилає updates на:

```text
POST /api/telegram/webhook
```

Нагадування запускаються scheduler-запитом на:

```text
GET|POST /api/worker/telegram-reminders
Authorization: Bearer <CRON_SECRET>
```

DB-backed імпортер салонів обробляється короткими викликами:

```text
GET|POST /api/worker/business-import
Authorization: Bearer <CRON_SECRET>
```

Детальна конфігурація: [`docs/business-importer.md`](docs/business-importer.md).

Для локальної розробки без публічного webhook використовуйте `npm run bot:dev`.

## SEO та запуск

До публічного запуску всі маршрути отримують `noindex, nofollow`, а `robots.txt` забороняє crawling. Індексація вмикається тільки через:

```env
ALLOW_INDEXING=true
```

Не встановлюйте цю змінну для preview або staging-середовищ.

## Перевірка перед змінами

```bash
npm test
npm run lint
npm run build
```

Додаткові продуктові правила та архітектурні обмеження описані в `CLAUDE.md`.
