# Skiggo Architecture

## Application
Next.js App Router + React + strict TypeScript, Tailwind CSS, reusable UI and Zod validation. Netlify hosts the Next.js application using its maintained adapter.

## Data and identity
Supabase PostgreSQL, Auth and Storage are the defaults. Create a dedicated Skiggo Supabase project before connecting production data; do not reuse PageFix AI production. Keep migrations in `supabase/migrations/`. Apply RLS to client-accessible tables and keep service-role credentials server-only.

## Boundaries
- `lib/auth`: server session and role checks
- `lib/marketplace`: catalogue, search, booking and quotation business rules
- `lib/payments`: provider adapters, verified webhooks, commission and ledger
- `lib/notifications`: email and in-app notifications
- `lib/location`: geocoding and server-side geographic matching
- `lib/validation`: shared Zod schemas
- `lib/security`: authorization, rate limits and safe file access

Keep booking transitions and financial calculations in server-side modules. Use database transactions, unique constraints and idempotency where duplicate requests could create inconsistent outcomes.

## Hosting
GitHub is source control; Netlify is the intended host. Next.js SSR/API routes must not be overridden by a static SPA catch-all. Runtime secrets belong in Netlify environment configuration and must never be committed.

## Current limitation
At discovery the GitHub repository was empty, and no Skiggo Netlify site was found. A Supabase project dedicated to Skiggo has not yet been identified. Phase 0/1 scaffold and public launch page are the first implementation target; live marketplace functionality is not yet connected.
