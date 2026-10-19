# Skiggo

**Get It Done.** Skiggo is a Nigeria-first, location-aware services marketplace that helps customers find service professionals, describe a job, receive quotes, and choose who gets it done.

> **Status:** Active development. The Supabase marketplace foundation is connected. This repository is under active implementation; do not treat Skiggo as production-ready until automated checks pass and the remaining critical workflows are complete.

## What is implemented

- Customer and service-provider sign-up/sign-in using Supabase Auth.
- Provider onboarding with business profile, service area, experience, and request preferences.
- Service listing management with draft/publish controls.
- Public service discovery backed by real published listings from verified providers.
- Customer service requests with category, job details, general area, optional NGN budget, service mode, and desired time.
- Provider request board and quote submission/withdrawal.
- Customer quote review, acceptance, and decline.
- Atomic quote acceptance: the chosen quote awards the request and competing pending quotes are declined.
- PostgreSQL Row Level Security policies and versioned database migrations.
- Seeded service categories and honest empty states when no published listings are available.

## Technology

- **Application:** Next.js App Router, React, TypeScript
- **Styling:** Tailwind CSS
- **Database and authentication:** Supabase PostgreSQL and Supabase Auth
- **Hosting and preview:** Railway
- **Quality:** ESLint, TypeScript, Vitest, GitHub Actions

## Repository layout

- `app/` — routes and page-level experiences
- `components/` — marketplace forms and dashboards
- `lib/` — Supabase configuration and marketplace data helpers
- `supabase/migrations/` — versioned database schema and security changes
- `docs/` — setup and development notes
- `.github/workflows/quality.yml` — automated quality checks

## Run locally

Requirements: Node.js 20+ and npm.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and set:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Run quality checks:
   ```bash
   npm run lint
   npm run typecheck
   npm test
   npm run build
   ```

The project currently has public Supabase configuration defaults for the dedicated Skiggo project. Environment variables can override them. Never put a Supabase service-role key in browser code, a `NEXT_PUBLIC_*` variable, or a committed file.

## Supabase and security

Tracked SQL migrations are in `supabase/migrations/`. They create profiles, service categories, provider profiles, service listings, service requests, and service quotes with Row Level Security and restricted status transitions.

Add the Railway deployment URL and any preview URL used for testing to the Supabase Auth Site URL / allowed redirect URLs as appropriate. Keep service-role credentials out of client-side code.

## Current limitations

Admin verification UI, booking lifecycle, in-app messaging, payment processing, reviews, notifications, and full production end-to-end acceptance testing are not yet complete. Provider verification remains platform-controlled. These features must be implemented and tested before the marketplace is described as fully production-ready.

## Development and deployment

The Railway preview service is intended to deploy the active implementation branch for review. The production service should track the stable `main` branch after changes are reviewed and merged. GitHub Actions runs dependency security checks, linting, TypeScript, tests, and the production build; verify all checks before promoting a build to production.
