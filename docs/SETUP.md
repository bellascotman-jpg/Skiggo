# Skiggo setup

## Supabase configuration

The current Skiggo project URL and publishable key are configured in `lib/supabase/config.ts` so the public catalogue and authentication client can connect without a separate environment setup. Deployment environment variables can override these defaults:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The publishable key is intended for browser use. Never place a Supabase secret/service-role key in a `NEXT_PUBLIC_*` variable or commit a secret key to Git. RLS and least-privilege grants are the security boundary.

Do not use credentials from PageFix AI or another product's production project. Skiggo has its own project and data boundary.

For production authentication, verify the Supabase Auth **Site URL** and allowed redirect URLs for the chosen deployment domain. A deployment site still needs to be connected before the public application can be considered live.

## Current implementation boundary

- Public landing page and service category catalogue are available in the app; active categories load from Skiggo Supabase with a safe static fallback.
- Public service listings are read from real database records only. Only published listings from verified providers are public.
- Customer and provider sign-up/sign-in use Supabase Auth. A database trigger creates the private profile on sign-up.
- Providers can submit professional profiles, save service drafts, and manage listings. Verification status is platform-controlled; unverified providers cannot publish or quote.
- Customers can post service requests, view quotes, accept/decline quotes, and track awarded requests. Quote acceptance atomically awards the request and closes competing pending quotes.
- Exact addresses, payment processing, bookings, messaging, reviews, notifications and admin verification tooling are not yet implemented. Do not treat these workflows as production-ready until their schema, server-side controls and tests are complete.

## Database migrations

The tracked migrations in `supabase/migrations/` match the applied migration history for the current Skiggo project. Apply future schema changes as new migrations; do not edit an already-applied migration for an active database.

## Quality checks

GitHub Actions is configured to run linting, TypeScript checks, unit tests and a production build on pushes and pull requests. A passing workflow is required before merging implementation work.
