# Імпортер салонів із Google Places

## Призначення

Суперадмін може відкрити `/admin/business-import`, знайти місто через Google Places Autocomplete (New), вибрати beauty-категорії та створити фоновий import job. Нові заклади зберігаються окремо від акаунтів майстрів зі статусом `IMPORT_PENDING_REVIEW` і не публікуються автоматично.

API key залишається на сервері. Браузер звертається тільки до endpoint-ів Get Node.

## Архітектура

Модуль розташований у `src/features/business-import`:

- `config` — категорії та ліміти;
- `domain` — незалежний від Google provider-контракт;
- `providers` — Google Places API (New);
- `services` — grid, retry, normalizer, deduplication, upsert і jobs;
- `workers` — DB-backed task runner;
- `validation` — Zod-схеми;
- `components` — admin UI.

Основні таблиці:

- `BusinessImportCity` — перевірений Google Place ID і viewport міста;
- `BusinessImportJob` — стан, counters, категорії та автор;
- `BusinessImportTask` — категорія, query, bounds, depth, attempts і lock;
- `ImportedBusiness` — непідтверджений або опублікований імпортований заклад.

`ImportedBusiness` не перетворюється автоматично на `Organization`: імпортований каталог і зареєстрований власник мають різні життєві цикли. Майбутній claim/merge flow зможе зв’язати їх після перевірки.

## Google API

У Google Cloud потрібно:

1. Увімкнути **Places API (New)**.
2. Увімкнути billing для проєкту.
3. Створити server API key.
4. Обмежити ключ Places API (New) та, де це підтримується deployment-ом, IP-адресами production server.

Використані методи:

- `POST https://places.googleapis.com/v1/places:autocomplete`;
- `GET https://places.googleapis.com/v1/places/{placeId}`;
- `POST https://places.googleapis.com/v1/places:searchText`.

Офіційна документація:

- [Autocomplete (New)](https://developers.google.com/maps/documentation/places/web-service/place-autocomplete)
- [Text Search (New)](https://developers.google.com/maps/documentation/places/web-service/text-search)
- [Place Details (New)](https://developers.google.com/maps/documentation/places/web-service/place-details)
- [Place Types (New)](https://developers.google.com/maps/documentation/places/web-service/place-types)
- [Usage and billing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing)
- [Google Maps Platform terms and policies](https://developers.google.com/maps/terms)

Кожен запит використовує явний `X-Goog-FieldMask`. Не використовується wildcard `*`.

Перед production-запуском окремо перевірте актуальні вимоги щодо зберігання Places content і атрибуції для вашої billing jurisdiction. Код зберігає source Place ID та timestamps і показує attribution note в admin UI, але цей документ не є юридичною консультацією.

## Environment variables

```env
GOOGLE_PLACES_SERVER_API_KEY=
CRON_SECRET=
```

`GOOGLE_PLACES_SERVER_API_KEY` не повинен мати префікс `NEXT_PUBLIC_`.

## Географічний алгоритм

1. City autocomplete повертає Google Place ID.
2. Backend повторно викликає Place Details і не довіряє координатам із браузера.
3. Перевірений viewport міста ділиться на початкову сітку 2×2.
4. Для кожної комірки, категорії та text query створюється DB task.
5. Text Search використовує rectangular `locationRestriction` і пагінацію.
6. Якщо після встановленого ліміту сторінок ще є `nextPageToken`, область вважається переповненою і ділиться на чотири.
7. Поділ зупиняється на `maxGridDepth=5` або розмірі комірки близько 1 км.
8. Результати поза city viewport відкидаються.
9. Place ID дедуплікуються до Place Details.

## Jobs, worker і відновлення

Створення job — короткий HTTP request: воно лише перевіряє місто й створює tasks. Обробка виконується короткими batch-викликами:

```bash
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://your-domain.example/api/worker/business-import
```

У Railway налаштуйте scheduler приблизно раз на хвилину. Admin UI також викликає process endpoint під час polling, але production не повинен залежати від відкритої вкладки.

Task claim використовує conditional update `PENDING → RUNNING`. Прострочений lock повертається в чергу. Кожна task має максимум 3 attempts; retry Google-запитів використовує exponential backoff. Скасування job переводить активні tasks у `CANCELLED`.

## Дедуплікація та оновлення

Гарантований idempotency key: `provider + externalId` (`GOOGLE + Place ID`). Додатково позначаються можливі дублікати за:

- нормалізованим телефоном;
- доменом;
- назвою та адресою;
- назвою й відстанню до 50 метрів.

Сумнівні записи не об’єднуються: новий запис отримує `manualReviewRequired=true`. Повторний імпорт оновлює лише поля імпортованої сутності й не змінює ручні `Organization`, `Location`, `Staff` або `StaffService`.

Place Details пропускається, якщо запис синхронізовано протягом 30 днів. Ліміти імпортера централізовано в `config/import-config.ts`: 3 паралельні tasks, 1 активний job і 30-денний refresh interval.

## Локальний запуск

```bash
npm ci
npx prisma migrate deploy
npm run dev
```

В `.env` задайте database/auth variables, `SUPER_ADMIN_EMAILS`, Google key і worker limits. Увійдіть під дозволеним email та відкрийте `/admin/business-import`.

## Перший тест на Києві

1. Виберіть країну «Україна».
2. Введіть «Київ» і виберіть Google autocomplete result.
3. Для дешевого smoke test виберіть одну категорію, наприклад «Барбершопи».
4. За потреби вимкніть детальні контакти, щоб не виконувати Place Details для кожного результату.
5. Натисніть «Почати імпорт».
6. Спостерігайте progress; після завершення відкрийте результати та опублікуйте тільки перевірені заклади.

## Додавання категорії або provider

Категорія додається лише в `config/categories.ts`: key, label, перевірені Google types і локалізовані text queries.

Новий provider реалізує `BusinessImportProvider`. Job orchestration, grid, deduplication та UI не залежать від конкретних Google response types.

## Тестування

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Тести мокають provider/API boundary і не виконують реальних Google-запитів.

## Відомі обмеження та наступний етап

### Імпорт послуг і цін із сайту

У картці кожного знайденого закладу одразу видно, чи доступний імпорт прайсу. Якщо Google Places не повернув публічний HTTP(S)-сайт, дія недоступна. Для доступного сайту суперадмін може запустити пошук: імпортер перевіряє адресу на SSRF, читає головну сторінку та до трьох внутрішніх сторінок послуг/цін, а AI створює лише чернетки позицій з явно вказаними цінами. Чернетки потрібно окремо підтвердити або відхилити; вони не стають послугами зареєстрованого майстра автоматично.

Для цього етапу потрібен `OPENAI_API_KEY`. Стани `NO_WEBSITE`, `NO_PRICES_FOUND` і `FAILED` зберігають зрозумілу причину безпосередньо на картці.

- In-memory autocomplete rate limit не є глобальним між кількома Node instances; для horizontal scaling потрібен shared limiter.
- Одночасний active-job limit перевіряється application-level; для великої кількості worker instances варто додати advisory lock або частковий DB constraint.
- Text Search не гарантує математично повний перелік усіх businesses Google Maps.
- Місто додатково перевіряється viewport; address components використовуються для нормалізації, але не для жорсткого відсіювання кожного результату.
- Публікація створює запис каталогу `ImportedBusiness`, але публічні SEO-сторінки поки працюють із зареєстрованими `Staff`; підключення published imported businesses до каталогу — наступний етап.
- «Знайти послуги та ціни» зараз disabled placeholder. Scraping/AI enrichment послуг і цін не входить у цю фазу.
