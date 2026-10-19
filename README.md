# Skiggo

**Get It Done.** Skiggo is a location-aware services marketplace designed to help customers find service professionals, describe a job, receive quotes, and choose who gets it done.

> **Project status:** Active development. Supabase is connected and the marketplace foundation is implemented on the `chore/skiggo-marketplace-phase1` branch. The pull request is still awaiting passing CI checks. Public production deployment is not yet confirmed.

## What is implemented

- Customer and service-provider sign-up/sign-in using Supabase Auth.
- Provider onboarding with business profile, service area, experience, and request preferences.
- Service listing management with draft/publish controls.
- Public service discovery backed by real published listings from verified providers.
- Customer service requests with category, job details, general area, optional NGN budget, service mode, and desired time.
- Provider request board and quote submission/withdrawal.
- Customer quote review, acceptance, and decline.
- Atomic quote acceptance: the chosen quote awards the request and competing pending quotes are declined.
- PostgreSQL Row Level Security policies and database migrations for marketplace data.
- Seeded service categories and honest empty states when no published listings are available.

## Technology

- Next.js App Router, React, TypeScript
- Tailwind CSS
- Supabase PostgreSQL and Supabase Auth
- ESLint, TypeScript checks, Vitest, and GitHub Actions
- Vercel deployment target (deployment setup in progress)

## Repository layout

- `app/` — routes and page-level experiences
- `components/` — marketplace forms and dashboards
- `lib/` — Supabase configuration and marketplace data helpers
- `supabase/migrations/` — versioned database schema and security changes
- `docs/` — setup, product, architecture, integrations, and development notes
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

The current code has safe public Supabase configuration defaults for the dedicated Skiggo project. Environment variables can override them. Never place a Supabase service-role key in browser code or commit private credentials.

## Database

Tracked SQL migrations are in `supabase/migrations/`. They create profiles, service categories, provider profiles, service listings, service requests, and service quotes, with Row Level Security and restricted status transitions.

Apply migrations through the Supabase migration workflow before deploying a fresh environment. Do not use a service-role key in client-side code.

## Current limitations

Admin verification UI, booking lifecycle, in-app messaging, payment processing, reviews, notifications, and full production end-to-end acceptance testing are not yet complete. Provider verification remains platform-controlled. Do not treat the current development build as production-ready until automated checks pass and these remaining workflows are implemented and tested.

## Development workflow

Changes are developed on feature branches and reviewed through pull requests. GitHub Actions checks lint, dependency security, TypeScript, tests, and the production build before the work is considered verified.
