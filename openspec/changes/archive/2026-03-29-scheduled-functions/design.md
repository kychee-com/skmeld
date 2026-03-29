## Context

SkMeld has SLA deadlines (`first_response_due_at`, `resolution_due_at`) set at request creation based on `priority_levels` config. The `v_request_board` view already computes `is_overdue_response` and `is_overdue_resolution` on the fly, and `board-card.tsx` already renders overdue styling (red border, alert triangle). But nothing proactively notifies staff when deadlines pass — overdue detection is passive (visible only when someone looks at the board).

Run402 Lambda layer v7 supports scheduled functions via `--schedule "<cron>"`. Prototype tier allows 2 scheduled functions — exactly what we need.

The deploy script currently sends functions as `{ name, code }[]` in the bundle payload. Run402's bundle deploy does not support per-function schedule metadata — scheduled functions must be deployed separately via the admin API or CLI after the bundle deploy.

## Goals / Non-Goals

**Goals:**
- Proactively detect overdue requests and log an event so there's a permanent record
- Notify assigned staff (or all staff if unassigned) via email when a request goes overdue
- Send a daily digest email summarizing open requests, newly overdue items, and requests awaiting action
- Keep scheduled functions within the 2-function prototype tier limit

**Non-Goals:**
- Real-time overdue push notifications (polling + view already handles visual indicators)
- Escalation workflows (auto-reassign, auto-priority-bump) — future work
- Configurable cron schedules via UI — hardcoded for now
- Replacing the existing view-computed overdue logic — the functions complement it, not replace it

## Decisions

### 1. Two functions, one per cron job

**Decision**: `check-sla-overdue.ts` (runs every 4 hours) and `daily-digest.ts` (runs daily at 7:00 AM UTC).

**Why**: Separate functions keep logic isolated and allow independent schedules. 4-hour SLA checks balance timeliness against unnecessary runs. Daily digest at 7 AM catches the start of the workday.

**Alternative considered**: Single function that does both — rejected because cron schedules differ and combining complicates the code.

### 2. Use `is_overdue_notified` flag on `maintenance_requests`

**Decision**: Add a boolean `is_overdue_notified` column (default `false`) to avoid re-notifying on every cron tick.

**Why**: The SLA check function needs idempotency. Without this, every 4-hour run would re-email staff about the same overdue requests. The flag also lets the view distinguish "newly overdue" from "already notified."

**Alternative considered**: Tracking notifications in `request_events` and checking for existing overdue events — works but requires a join on every check; a simple boolean is faster and more direct.

### 3. Deploy scheduled functions via post-deploy CLI calls

**Decision**: After the bundle deploy, call the Run402 admin API to set schedules on the two new functions.

**Why**: The bundle deploy endpoint takes `{ name, code }[]` and does not accept per-function schedule config. The schedule is set via `POST /projects/v1/admin/:id/functions/:name/schedule` or the `run402 functions deploy --schedule` CLI flag. We'll add a post-deploy step in `deploy.ts` that hits the admin API.

**Alternative considered**: Deploying scheduled functions entirely outside the bundle — rejected because we still want their code in the bundle for atomic deploys, just adding the schedule afterward.

### 4. Daily digest uses `email.send()` with raw HTML mode

**Decision**: Use `email.send({ to, subject, html, from_name })` for the digest since it needs formatted tables and counts.

**Why**: Template mode is too rigid for dynamic content like variable-length request lists and aggregate stats. Raw HTML mode (available since layer v4) lets us build the email body programmatically.

### 5. Overdue board indicator — already done

**Decision**: No frontend changes needed.

**Why**: `v_request_board` already computes `is_overdue_response` and `is_overdue_resolution`. `board-card.tsx` already renders a red border and alert triangle for overdue cards. The scheduled function adds proactive notification, not visual changes.

## Risks / Trade-offs

- **[Tier limit]** Prototype tier allows exactly 2 scheduled functions. If we need a third, we must upgrade. → Mitigation: Design both functions to be extensible (the SLA checker could also handle future escalation logic).
- **[Email volume]** If many requests go overdue simultaneously, the SLA checker sends one email per request. → Mitigation: Batch overdue notifications into a single email per staff member listing all their overdue requests.
- **[Timezone]** Daily digest fires at 7:00 AM UTC, which may not match the user's timezone. → Mitigation: Acceptable for v1. Future: read timezone from `app_settings`.
- **[Schema migration]** Adding `is_overdue_notified` column to `maintenance_requests` requires a schema migration. → Mitigation: `ALTER TABLE ADD COLUMN` with default is safe, no data migration needed.
