## Why

Maintenance requests have SLA deadlines, but nothing checks whether those deadlines have passed. Staff only discover overdue requests by manually scanning the board. Run402 now supports scheduled functions (`--schedule "<cron>"`), which lets us add automated background jobs without any infrastructure work.

## What Changes

- Add a **`check-sla-overdue`** scheduled function that runs daily, finds requests past their SLA deadline, and marks them with an overdue event + optional email notification to assigned staff.
- Add a **`daily-digest`** scheduled function that sends a morning summary email to staff/admin with open request counts, newly overdue items, and requests awaiting action.
- Update the deploy script to deploy functions with `--schedule` cron expressions.
- Add a frontend indicator for overdue requests on the board (e.g., red badge or border).

## Capabilities

### New Capabilities
- `sla-overdue-checker`: Background cron function that detects overdue maintenance requests and logs events/sends notifications.
- `daily-digest-email`: Background cron function that sends a daily summary email to staff and admin users.
- `overdue-board-indicator`: Frontend visual indicator on board cards for requests that are past their SLA deadline.

### Modified Capabilities
- `skmeld-deploy`: Deploy script needs to support the `--schedule` flag when deploying scheduled functions.
- `skmeld-functions`: Functions list grows from 7 to 9; CLAUDE.md and deploy.ts function list must be updated.

## Impact

- **Functions**: Two new files in `functions/` — `check-sla-overdue.ts` and `daily-digest.ts`. Both import `db` and `email` from `@run402/functions`.
- **Deploy**: `deploy.ts` must pass schedule metadata per-function in the bundle deploy payload (or deploy scheduled functions separately via CLI).
- **SQL**: May need a `last_sla_check_at` or `is_overdue` column on `maintenance_requests` to avoid re-notifying, plus an index on `sla_deadline`.
- **Frontend**: Board card component needs conditional overdue styling. The `v_request_board` view already includes `sla_deadline` — frontend can compare against `now()`.
- **Tier limit**: Prototype tier allows 2 scheduled functions, which is exactly what we're adding.
