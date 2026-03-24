## Context

SkMeld's invite flow: admin creates invites via `create-invites` function → gets back claim URLs → must manually send them. The `create-invites` and `redeem-invite` functions are not deployed in production (hit the 5-function tier limit during initial deploy).

Run402 now has an email API: `POST /mailboxes/v1/{mailbox_id}/messages` with a `project_invite` template that accepts `to`, `inviter_name`, `project_name`, and `invite_url`. Functions have access to `process.env.RUN402_SERVICE_KEY` and `process.env.RUN402_API_BASE`.

## Goals / Non-Goals

**Goals:**
- Send invite emails automatically when admin creates invites
- Use the Run402 `project_invite` email template
- Make email a required field for invites (needed for delivery)
- Deploy the invite functions to production
- Show delivery status in the UI

**Non-Goals:**
- Custom email templates or HTML email design (use Run402's built-in template)
- Email tracking (open/click rates)
- Resend functionality (can add later)
- Bulk email operations beyond the existing invite-by-invite loop

## Decisions

### 1. Email sending in create-invites function, not a separate function

Send the email inline in the `create-invites` function loop, right after inserting each invite record. This keeps the flow atomic and avoids adding another function (which would worsen the tier limit issue).

**Alternative considered:** Separate `send-invite-email` function called from the frontend after invite creation. Rejected because it splits a single logical operation into two network calls and introduces partial-failure states (invite created but email not sent with no retry).

### 2. Mailbox ID via environment variable

Store the mailbox ID as a function environment variable (`MAILBOX_ID`) set during deployment. The mailbox is created once via CLI (`run402 email create skmeld`).

**Why not query the mailbox API at runtime?** Unnecessary overhead — the mailbox ID is static per project.

### 3. Email failure is non-fatal

If the email API call fails, the invite is still created successfully. The response includes `email_sent: false` with the error. The admin can copy the claim URL manually as a fallback.

**Why?** The invite record is the source of truth. Email is a delivery mechanism that can fail (rate limits, transient errors). The admin should always get the claim URL back.

### 4. Function deployment strategy

Check if the 5-function limit has been raised. If not, consolidate: the `bootstrap` function is only needed once and can be removed to make room, or check if the tier now supports more functions.

## Risks / Trade-offs

- **Rate limit (10/day on prototype tier)** → Admins inviting more than 10 users/day will get email failures. The fallback (manual URL copy) still works. Mitigated by showing the rate limit clearly in error messages.
- **Mailbox not created** → If `MAILBOX_ID` env var is missing, email sending is silently skipped. The invite still succeeds. Mitigated by checking for the env var and returning `email_sent: false, error: "Email not configured"`.
- **Function deployment blocked by tier limit** → May need to delete the `bootstrap` function (already ran, no longer needed) to free a slot.
