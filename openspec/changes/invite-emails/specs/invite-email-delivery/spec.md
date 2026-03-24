## ADDED Requirements

### Requirement: Invite email sent on invite creation
When an admin creates an invite with an email address, the `create-invites` function SHALL send an invite email via the Run402 email API using the `project_invite` template. The email MUST include the invitee's claim URL, the inviter's name, and the project name.

#### Scenario: Invite created with email — email sent successfully
- **WHEN** admin creates an invite with `email: "alice@example.com"`
- **THEN** the function calls `POST /mailboxes/v1/{MAILBOX_ID}/messages` with template `project_invite`, `to: "alice@example.com"`, `invite_url: <claim_url>`, `inviter_name: <admin name>`, `project_name: <app name>`, and the response includes `email_sent: true`

#### Scenario: Invite created — email API fails
- **WHEN** admin creates an invite but the email API returns an error (rate limit, network failure)
- **THEN** the invite record is still created, the response includes `email_sent: false` and `email_error: <message>`, and the `claim_url` is still returned so the admin can share it manually

#### Scenario: Invite created without email
- **WHEN** admin creates an invite without an email address
- **THEN** no email is sent, `email_sent: false` is returned, and the `claim_url` is returned for manual sharing

#### Scenario: Mailbox not configured
- **WHEN** the `MAILBOX_ID` environment variable is not set
- **THEN** no email is attempted, `email_sent: false` and `email_error: "Email not configured"` are returned, and the invite is created normally

### Requirement: Email sending uses app settings for project name
The email template's `project_name` variable SHALL be read from the `app_settings` table (`app_name` key) so it matches what the admin configured in Settings.

#### Scenario: Custom app name used in email
- **WHEN** app_settings has `app_name = "Sunrise Properties"`
- **THEN** the invite email uses "Sunrise Properties" as the project_name
