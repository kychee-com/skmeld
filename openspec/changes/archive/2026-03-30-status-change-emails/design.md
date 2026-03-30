## Context

`transition-request.ts` handles all status changes and already fetches the request, the actor's profile, and status labels. `add-comment.ts` already has the request, actor profile, and comment body. Both log events after their main operation — email notifications go right alongside these event inserts.

`email.send()` is imported from `@run402/functions` and auto-discovers the project mailbox. Raw HTML mode supports `{ to, subject, html, from_name }`.

## Goals / Non-Goals

**Goals:**
- Notify the requester (resident) when their request status changes
- Notify assigned staff when a resident comments on their request
- Notify the requester when staff adds a public comment
- Use raw HTML for formatted emails with request details

**Non-Goals:**
- Internal note notifications (internal comments are staff-only, no email)
- Notification preferences or opt-out (v1 — everyone gets notified)
- Email on assignment changes (could be added later in `update-request.ts`)
- Batching or digest mode — each event sends immediately

## Decisions

### 1. Fire-and-forget email sends

**Decision**: Wrap `email.send()` in try/catch and log failures but never fail the request.

**Why**: Email delivery should not block or roll back a successful status transition. If the email fails, the event is still logged in `request_events` and visible on the timeline.

### 2. Determine recipient from request context

**Decision**:
- **Status change**: Always email the requester (`requester_profile_user_id` → lookup email from profiles). If the actor IS the requester (resident closing their own), email the assigned staff instead.
- **Comment**: Email the "other party" — if staff comments, email requester. If resident comments, email the assigned staff (or all admins if unassigned).

**Why**: Simple, predictable. The person who took the action doesn't need to be emailed about it.

### 3. Subject line format

**Decision**: `[AppName] Request #NNNN — <status label>` for transitions, `[AppName] Request #NNNN — New comment` for comments.

**Why**: The request number in the subject makes it easy to find related emails. The app name as prefix matches the SLA overdue and digest email patterns.

### 4. Minimal HTML body

**Decision**: Short HTML with request title, new status (or comment excerpt), and public note if any. No full timeline or heavy formatting.

**Why**: Notification emails should be concise — the user can open the app for full details.

## Risks / Trade-offs

- **[Email volume]** Prototype tier allows 10 emails/day. A flurry of status changes could exhaust the limit. → Mitigation: Acceptable for demo. Hobby tier allows 50/day.
- **[No opt-out]** Users can't disable notifications. → Mitigation: v1 scope. Add preferences later.
- **[Missing email]** If the requester's profile has no email (e.g., submitted by staff on behalf), the notification silently skips. → Mitigation: This is correct behavior — can't notify someone with no email address.
