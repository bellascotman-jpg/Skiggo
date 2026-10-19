# Skiggo

**Get It Done.**

Skiggo is a Nigeria-first, location-aware services marketplace being built to help people find service professionals, post jobs, receive quotations, and hire with greater confidence.

## Project status

**Active development — not yet production-ready.** The main branch contains the initial public-site foundation. The richer Supabase marketplace implementation is being reviewed in [Pull Request #2](https://github.com/bellascotman-jpg/Skiggo/pull/2). A Railway preview deployment is being configured from that implementation branch.

## Product direction

- Discover services by category and service area.
- Customer and provider accounts.
- Provider profiles and service listings.
- Customer job requests and provider quotations.
- Secure quote acceptance and request award.
- Platform-controlled provider verification and database-enforced access controls.
- Later phases: bookings, messaging, payments, reviews, notifications, and admin tools.

## Technology

- Next.js App Router, React, TypeScript
- Tailwind CSS
- Supabase PostgreSQL and Supabase Auth
- Railway for hosting and preview deployments
- GitHub Actions for linting, type checks, tests, dependency auditing, and production builds

## Repository map

- `app/` — application routes
- `components/` — interface components
- `lib/` — application helpers and Supabase configuration
- `supabase/migrations/` — database schema and security migrations
- `docs/` — product, architecture, integration, and development documentation
- `.github/workflows/` — automated quality checks

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set the public Supabase project URL and publishable key in `.env.local` if you need to override the project defaults:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Quality checks:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Security notes

- Do not commit `.env.local` or private credentials.
- Never expose a Supabase service-role key in browser code or any `NEXT_PUBLIC_*` variable.
- Marketplace data must be protected by database Row Level Security, not only by interface logic.
- Do not invent providers, reviews, verification status, bookings, payments, or marketplace metrics.

## Contributing and releases

The marketplace foundation is being reviewed in [Pull Request #2](https://github.com/bellascotman-jpg/Skiggo/pull/2). CI must pass before the reviewed implementation is merged and promoted. Railway's preview service tracks the implementation branch; the stable production service should follow `main`.

## License

A license has not yet been selected. All rights are reserved unless a license is added to this repository.
