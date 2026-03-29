## 1. Schema Migration

- [x] 1.1 Add `is_overdue_notified BOOLEAN DEFAULT false` column to `maintenance_requests` in `schema.sql`
- [x] 1.2 Add index on `(first_response_due_at, resolution_due_at)` for efficient overdue queries in `schema.sql`

## 2. SLA Overdue Checker Function

- [x] 2.1 Create `functions/check-sla-overdue.ts` — query overdue requests where `is_overdue_notified = false`, group by assignee
- [x] 2.2 Add overdue event logging — insert `request_events` rows with `sla_overdue_response` or `sla_overdue_resolution` event types
- [x] 2.3 Add batched email notification — one email per staff member listing their overdue requests, unassigned requests emailed to all `owner_admin` users
- [x] 2.4 Set `is_overdue_notified = true` on notified requests

## 3. Daily Digest Function

- [x] 3.1 Create `functions/daily-digest.ts` — query aggregate counts (open, overdue, awaiting response) and per-staff assigned requests
- [x] 3.2 Build HTML email body with summary section and per-request table (request number, title, priority, status, age, assignee)
- [x] 3.3 Send digest via `email.send()` with raw HTML mode to each staff/admin user; skip if zero open requests

## 4. Update Request SLA Reset

- [x] 4.1 In `functions/update-request.ts`, reset `is_overdue_notified` to `false` when `first_response_due_at` or `resolution_due_at` is updated to a future date

## 5. Deploy Script

- [x] 5.1 Add `check-sla-overdue.ts` and `daily-digest.ts` to the `functionFiles` array in `deploy.ts`
- [x] 5.2 Add post-deploy step in `deploy.ts` that calls the Run402 admin API to set cron schedules: `0 */4 * * *` for `check-sla-overdue`, `0 7 * * *` for `daily-digest`

## 6. Documentation

- [x] 6.1 Update CLAUDE.md functions list to include `check-sla-overdue.ts` and `daily-digest.ts` with their schedules
- [x] 6.2 Update CLAUDE.md integration log to note scheduled functions as adopted
