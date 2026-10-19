# Skiggo setup

## Required environment variables

Copy `.env.example` to `.env.local` and set the values from the dedicated Skiggo Supabase project's Connect dialog:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Only the project URL and publishable key belong in browser-visible environment variables. Never place a Supabase secret/service-role key in a `NEXT_PUBLIC_*` variable or commit real credentials to Git.

Do not use credentials from PageFix AI or another production project. Skiggo needs its own project and data boundary.

## Current implementation boundary

- Public landing page and service category catalogue are available in the app.
- Category search filters the catalogue; it does not claim to search live providers yet.
- Sign-up and sign-in screens are wired to Supabase Auth but remain disabled until the dedicated project's environment variables are present.
- Provider listings, verification, bookings, quotes, payments, reviews and admin operations are not considered live until their database schema, access policies, server-side workflows and tests are implemented.

## Quality checks

The GitHub Actions workflow runs linting, TypeScript checks, unit tests and a production build for pull requests. A passing workflow is required before merging implementation work.
