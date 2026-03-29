# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is SkMeld

Property maintenance request tracker for landlords, small property managers, HOAs, and office/facilities managers. Open-source alternative to Property Meld. Deployed on the Run402 platform (Postgres + PostgREST + Lambda functions + S3).

## Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # Type-check (tsc -b) then build to site/
npm run preview      # Preview production build
npm run deploy       # Deploy to Run402 (requires BUYER_PRIVATE_KEY in ../../.env)
npm run deploy:publish  # Deploy + publish to Run402 marketplace
```

No test runner or linter is configured.

## Architecture

### Frontend (src/)

React 19 + TypeScript + Vite SPA. Path alias `@/` maps to `src/`.

- **Providers** (`main.tsx`): QueryClientProvider → BrowserRouter → AuthProvider → App
- **Routing** (`App.tsx`): `/login`, `/claim` (invite redemption) are public. `/app/*` is protected. Residents redirect to `/app/my-requests`, staff/admin to `/app/board`.
- **Auth** (`lib/auth.tsx`): Context-based auth using Run402 JWT. Session stored in `localStorage` as `skmeld_session`. Three roles: `owner_admin`, `staff`, `resident`.
- **API client** (`api/client.ts`): Thin wrappers (`apiGet`, `apiPost`, `apiPatch`, `apiDelete`, `invokeFunction`) over `fetch` that attach the `apikey` header (anon key) and JWT `Authorization` header. Configured via `VITE_API_BASE` and `VITE_ANON_KEY` env vars.
- **Data fetching** (`hooks/`): TanStack Query hooks. Board cards poll every 15s. Board statuses have 60s stale time.
- **UI**: Tailwind CSS + shadcn/ui components (Radix primitives). Board uses dnd-kit for drag/drop.

### Backend

#### SQL (sql/)

Schema is data-driven — no Postgres enums. Workflow concepts (statuses, priorities, categories, transitions) are config tables, not code.

- `schema.sql` — all table definitions
- `seed-base.sql` — default roles, statuses, priorities, categories
- `rls.sql` — Row Level Security policies. Uses `get_user_role()` helper (SECURITY DEFINER) to check app-level role from `profiles` table. Residents see only their own requests; staff/admin see all.
- `views.sql` — `v_request_board` (denormalized kanban cards), `v_request_activity` (timeline union of events + comments), `v_request_export` (CSV-friendly flat view), `v_request_metrics` (dashboard aggregates). All use `security_invoker = true`.

#### Functions (functions/)

Run402 Lambda functions (TypeScript). Import `db`, `getUser`, and `email` from `@run402/functions`. Writes to `maintenance_requests` go through functions (not direct PostgREST) so business logic (SLA calculation, event logging, transition validation) is enforced server-side.

- `bootstrap.ts` — first-admin setup + optional demo data seeding
- `submit-request.ts` — create request with SLA deadlines, occupancy validation
- `update-request.ts` — edit request fields
- `transition-request.ts` — status changes with role-based transition validation
- `add-comment.ts` — add comment with optional attachments
- `create-invites.ts` / `redeem-invite.ts` — invite flow for onboarding users

### Deploy (deploy.ts)

Single-script deploy to Run402 using x402 micropayments and SIWx auth. Bundles SQL migrations, functions, and built site files into one API call.

### Config (run402.yaml)

Run402 app manifest. Defines bootstrap variables (admin_email, app_name, seed_demo_data) and marketplace publishing settings.

## Run402 Integration Log

**Last sync: 2026-03-29** — aligned with Run402 Lambda layer v7.

Changes applied from Run402 upstream:
- **`email.send()` helper** (layer v4+): Replaced manual `fetch()` to mailbox API in `create-invites.ts` with `import { email } from '@run402/functions'` + `email.send()`. Eliminates hardcoded MAILBOX_ID, API_BASE, SERVICE_KEY.
- **Parameterized `db.sql()`** (layer v6+): Replaced string-interpolated SQL in `redeem-invite.ts` with `db.sql('...WHERE token = $1', [token])`. Fixes SQL injection risk.
- **`getUser()` returns email** (layer v7): `getUser(req)` now returns `{ id, role, email }`. Available for use in functions that need the caller's email without a profile lookup.

### Not-yet-adopted Run402 features (potential improvements)

- **Scheduled functions** (`--schedule "<cron>"`): Could add an SLA-overdue checker or daily digest emailer.
- **Google OAuth**: Zero-config social login — could add a "Sign in with Google" button on login page.
- **Content-Range CORS**: Frontend can now read `Content-Range` from PostgREST for pagination counts.
- **Raw HTML email mode**: `email.send({ to, subject, html })` — useful for richer notification emails beyond templates.
