# Skiggo

**Get It Done.** A location-aware service marketplace connecting customers with service professionals.

## Project status

The repository was empty at discovery. Phase 0 foundation and Phase 1 public website are being established incrementally. No live marketplace functionality should be assumed until documented and tested.

## Stack

- Next.js App Router, React, TypeScript
- Tailwind CSS
- Supabase PostgreSQL/Auth/Storage (dedicated Skiggo project required)
- Netlify hosting
- Playwright for end-to-end tests

## Local development

1. Install Node.js 20 or newer and npm.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and fill in credentials for a dedicated Skiggo Supabase project.
4. Run `npm run dev`.
5. Run `npm run lint`, `npm run typecheck`, and `npm run build` before submitting changes.

Never commit `.env.local` or production secrets.

## Documentation

- `docs/PRODUCT_SPEC.md`
- `docs/ARCHITECTURE.md`
- `docs/INTEGRATIONS.md`
- `docs/DEVELOPMENT_STATUS.md`
