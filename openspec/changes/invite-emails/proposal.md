## Why

When an admin invites a staff member or resident, the app creates a database record and returns a claim URL, but the invitee is never notified. The admin must manually copy and send the link. Run402 now provides a built-in email API (`POST /mailboxes/v1/{id}/messages`) with a `project_invite` template, making it straightforward to send invite emails automatically. Additionally, the `create-invites` and `redeem-invite` functions were never deployed due to a 5-function tier limit — this change also addresses that blocker.

## What Changes

- Create a Run402 mailbox for the project (`run402 email create skmeld`)
- Modify the `create-invites` function to send an invite email via the Run402 email API after creating each invite record, using the `project_invite` template
- Add an `email` field requirement to the invite form — email is now required (was optional before) since we need a recipient
- Deploy the `create-invites` and `redeem-invite` functions (currently missing from production due to the 5-function tier limit — check if limit has been raised or consolidate functions)
- Show email delivery status in the invite results returned to the frontend

## Capabilities

### New Capabilities
- `invite-email-delivery`: Sending invite emails via Run402 email API from the create-invites function

### Modified Capabilities
- `skmeld-functions`: The `create-invites` function gains email sending via the Run402 mailbox API after invite creation
- `skmeld-frontend`: People page invite form makes email a required field; shows email delivery status on invite results

## Impact

- `functions/create-invites.ts` — Add email sending logic using `POST /mailboxes/v1/{mailbox_id}/messages` with `project_invite` template
- `src/pages/people.tsx` — Make email required in invite form, show delivery status
- Run402 project — Requires one-time mailbox creation via `run402 email create skmeld`
- Deployment — Need to deploy `create-invites` and `redeem-invite` functions (blocked by 5-function limit previously)
- No schema changes required — `invites` table already has an `email` column
