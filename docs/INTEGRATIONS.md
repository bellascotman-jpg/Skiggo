# Integration Register

Status values: NOT_STARTED, CONFIGURATION_REQUIRED, IMPLEMENTED_UNTESTED, TESTED_IN_SANDBOX, VERIFIED_IN_PRODUCTION, DEGRADED, DISABLED.

| Integration | Purpose | Status | Required action / evidence |
|---|---|---|---|
| GitHub | Source control | CONFIGURATION_REQUIRED | Repository exists but was empty at discovery; scaffold commits are being added. |
| Netlify | Hosting and deploy previews | CONFIGURATION_REQUIRED | Connected account is available; no Skiggo site was found in the connected account. Create/link site to repository and confirm deploy. |
| Supabase | PostgreSQL, Auth, Storage, RLS | CONFIGURATION_REQUIRED | Create or identify a dedicated Skiggo project. Do not use PageFix AI production. Configure URL and publishable/anon key in Netlify. |
| PostGIS | Geographic matching | NOT_STARTED | Confirm extension availability and query needs before migration. |
| Flutterwave | Checkout and payments | NOT_STARTED | Business/account eligibility, credentials, supported marketplace settlement and sandbox tests required. |
| Resend | Transactional email | NOT_STARTED | Account, sending domain and SPF/DKIM configuration required. |
| Maps/geocoding | Address search and distance | NOT_STARTED | Compare Nigeria coverage, pricing and API restrictions before selecting provider. |
| SMS/WhatsApp | Optional notifications | NOT_STARTED | Defer until core workflows and provider cost are validated. |
| Identity verification | Optional specialist checks | NOT_STARTED | Begin with admin-reviewed workflow; evaluate provider and legal requirements first. |
| Error monitoring | Production diagnostics | NOT_STARTED | Start with platform logs; add service when needed. |
| AI API | Optional natural-language assistance | NOT_STARTED | Defer until core marketplace is reliable. |

Never promote an integration status without recorded test evidence. Keep secrets out of this file and source control.
