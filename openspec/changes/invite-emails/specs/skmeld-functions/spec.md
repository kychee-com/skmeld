## MODIFIED Requirements

### Requirement: create-invites function sends email after invite creation
The `create-invites` function SHALL, after inserting each invite record, attempt to send an invite email if an email address is provided. Email sending uses `POST /mailboxes/v1/{MAILBOX_ID}/messages` with the `project_invite` template. The function reads the inviter's profile name and the app name from the database. Each invite result object SHALL include `email_sent` (boolean) and optionally `email_error` (string).

#### Scenario: Invite with email triggers email delivery
- **WHEN** the function receives an invite with `email: "user@example.com"`
- **THEN** after inserting the invite, the function calls the email API and includes `email_sent: true` in the response

#### Scenario: Email delivery failure does not block invite creation
- **WHEN** the email API call fails for any reason
- **THEN** the invite record remains in the database, and the response includes `email_sent: false, email_error: "<reason>"`
