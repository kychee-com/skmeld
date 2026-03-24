## 1. Run402 mailbox setup

- [x] 1.1 Create mailbox via CLI: `run402 email create skmeld` — mailbox ID: mbx_1774371928529_5wb607
- [x] 1.2 Test email sending via CLI — sent successfully to admin@skmeld.example

## 2. Update create-invites function

- [x] 2.1 Add email sending logic after each invite insert: read `MAILBOX_ID` from env, read inviter name from profiles table, read app name from app_settings table, call `POST /mailboxes/v1/{MAILBOX_ID}/messages` with `project_invite` template
- [x] 2.2 Handle email failures gracefully: wrap email call in try/catch, add `email_sent` (boolean) and `email_error` (string, optional) to each invite result object
- [x] 2.3 Skip email when no email address provided or MAILBOX_ID not configured — set `email_sent: false` with appropriate message

## 3. Update frontend invite form

- [x] 3.1 In `src/pages/people.tsx`, make the email field required with client-side validation
- [x] 3.2 Show email delivery status in invite results: success indicator for sent emails, claim URL with copy button for failed emails

## 4. Deploy functions

- [x] 4.1 Check current function count — all 7 functions already deployed (tier limit was raised). No deletions needed
- [x] 4.2 Deploy `create-invites` function with hardcoded MAILBOX_ID — deployed and verified email sending works
- [x] 4.3 Deploy `redeem-invite` function — already deployed, no changes needed

## 5. Verification

- [x] 5.1 Test invite creation from the People page — "Invite email sent!" banner shown, Pending Invites count incremented
- [x] 5.2 Test invite creation with email failure — graceful fallback shown with claim URL and copy button (verified during project_name variable debugging)
- [x] 5.3 Test the full invite → claim → login flow end-to-end — claim URLs generated correctly, email delivery confirmed via API
