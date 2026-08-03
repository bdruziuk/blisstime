# EasyService

EasyService is a Ukrainian web-first platform for beauty professionals, salons, and their clients. The repository was originally developed under the working name **BlissTime**.

The product includes:

- a professional dashboard with bookings, services, CRM, income tracking, working hours, and Telegram notifications;
- a public catalog with city- and service-based search, SEO-friendly routes, and booking without registration;
- a super-admin panel for managing users, professionals, salons, publication status, and imported businesses;
- a Google Places importer for discovering salons and importing contact details, ratings, locations, and business metadata;
- AI-assisted price-list extraction into structured services.

## Technology stack

- Next.js 15 App Router, React 19, and TypeScript;
- Tailwind CSS 4, shadcn/ui, and Base UI;
- PostgreSQL and Prisma 7;
- Auth.js 5 with email and password authentication;
- Telegram Bot API;
- Google Places API (New);
- OpenAI API;
- Vitest for unit and integration tests.

## Project structure

```text
src/app/(app)       dashboard, authentication, onboarding, and admin pages
src/app/(public)    landing page, catalog, public profiles, and reviews
src/app/api         Auth.js, admin APIs, webhooks, and background workers
src/features        feature-oriented business modules
src/lib             Prisma, Auth.js, Telegram, and shared utilities
prisma              database schema, migrations, and seed data
scripts             local maintenance and Telegram polling scripts
docs                implementation and operations documentation
```

The dashboard and public catalog run in the same Next.js application and use a shared PostgreSQL database.

## Requirements

- Node.js 20 or newer;
- npm;
- PostgreSQL with the `btree_gist` extension;
- a Telegram bot for Telegram notifications and local polling;
- a Google Places API key for salon imports;
- an OpenAI API key for AI-assisted price-list imports.

## Local development

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env
   ```

   PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

3. At minimum, configure `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `NEXT_PUBLIC_APP_URL`.

4. Apply database migrations and seed the service taxonomy:

   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Auth.js signing secret |
| `NEXTAUTH_URL` | Base URL used by Auth.js |
| `NEXT_PUBLIC_APP_URL` | Public application URL |
| `SUPER_ADMIN_EMAILS` | Comma-separated super-admin email addresses with access to `/admin` |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token |
| `TELEGRAM_BOT_USERNAME` | Bot username without `@` |
| `TELEGRAM_WEBHOOK_SECRET` | Secret used to verify Telegram webhook requests |
| `CRON_SECRET` | Bearer token protecting worker endpoints |
| `OPENAI_API_KEY` | OpenAI API key for AI-assisted price-list imports |
| `GOOGLE_PLACES_SERVER_API_KEY` | Server-side Google Places API (New) key used by the salon importer |
| `ALLOW_INDEXING` | Enables search-engine indexing only when set exactly to `true` |

The complete template is available in `.env.example`. Never commit the local `.env` file.

## Commands

```bash
npm run dev          # start Next.js locally with Turbopack
npm run build        # create a production build
npm run start        # apply migrations and start the production server
npm run start:web    # start production without automatically applying migrations
npm run lint         # run ESLint
npm test             # run the test suite once
npm run test:watch   # run Vitest in watch mode
npm run db:seed      # seed the service-category taxonomy
npm run bot:dev      # run Telegram long polling locally
```

## Database and booking rules

Money is stored as integer minor units, and timestamps are stored in UTC. The business timezone is currently fixed to `Europe/Kyiv`.

A PostgreSQL exclusion constraint prevents overlapping bookings for the same professional. Active `PENDING` holds also reserve a time slot. Available slots are generated in 15-minute increments from working hours, breaks, time off, existing bookings, and active holds.

Do not edit migrations that have already been deployed. Create a new Prisma migration for every schema change.

## Business importer

The importer discovers beauty businesses through Google Places and stores processing state in the database. Imports can be started and moderated from `/admin/business-import`.

Imported businesses may include:

- localized name and address;
- city, district, regional center, and coordinates;
- national and international phone numbers;
- website and Google Maps URLs;
- Google rating and review count;
- opening hours and business status;
- automatically inferred beauty categories based on the business name.

Google Places does not expose business email addresses. An email-discovery workflow would need to inspect the business website separately.

The background worker accepts short, repeatable requests:

```text
GET|POST /api/worker/business-import
Authorization: Bearer <CRON_SECRET>
```

Detailed configuration is documented in [`docs/business-importer.md`](docs/business-importer.md).

## Telegram

In production, Telegram sends updates to:

```text
POST /api/telegram/webhook
```

The reminder worker is triggered through:

```text
GET|POST /api/worker/telegram-reminders
Authorization: Bearer <CRON_SECRET>
```

For local development without a public webhook, run `npm run bot:dev`.

## SEO and indexing

Until public launch, routes return `noindex, nofollow`, and `robots.txt` prevents crawling. Enable indexing only in the production environment:

```env
ALLOW_INDEXING=true
```

Do not enable this variable for preview or staging deployments.

Public search routes use readable Latin slugs:

```text
/{city}/{service}
/{kyiv}/{district}/{service}
```

Search queries can be appended with the `q` query parameter while city, district, and service remain path segments.

## Validation before deployment

```bash
npm test
npm run lint
npm run build
```

Additional product rules and architectural constraints are documented in `CLAUDE.md`.
