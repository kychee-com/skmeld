## Why

When a maintenance request changes status (triaged, in progress, resolved, etc.) or receives a new comment, nobody gets notified — the requester and staff only see updates by checking the board. For residents especially, knowing their request was picked up or resolved is critical. The `email.send()` helper and raw HTML mode are already available, so adding notifications is straightforward.

## What Changes

- **Status change emails**: When `transition-request.ts` changes a request's status, email the requester (resident) with the new status and any public note. For internal transitions (staff-to-staff), email the assigned staff member.
- **Comment notification emails**: When `add-comment.ts` adds a public comment, email the other party (staff comment → notify resident, resident comment → notify assigned staff).
- **Notification preferences**: No opt-out mechanism in v1 — all notifications are sent. Future: add a `notification_preferences` column or table.

## Capabilities

### New Capabilities
- `status-change-notifications`: Email notifications sent from `transition-request.ts` when request status changes.
- `comment-notifications`: Email notifications sent from `add-comment.ts` when a public comment is added.

### Modified Capabilities
- `skmeld-functions`: `transition-request.ts` and `add-comment.ts` gain `email` import and notification logic.

## Impact

- **Functions**: `transition-request.ts` and `add-comment.ts` — add `email` import and notification calls after the existing event logging. No new functions needed.
- **No schema changes**: Recipient emails come from existing `profiles` table lookups.
- **Email volume**: Bounded by user actions — one email per status change, one per comment. Well within prototype tier's 10/day limit for demo use.
- **No frontend changes**.
