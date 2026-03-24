## MODIFIED Requirements

### Requirement: Invite form requires email address
The People page invite form SHALL require an email address for each invite. The email field MUST have `required` validation. The form SHALL display a note explaining that an invite email will be sent to the address.

#### Scenario: Admin submits invite with email
- **WHEN** admin fills in the invite form with a valid email
- **THEN** the invite is created and the email delivery status is shown

#### Scenario: Admin submits invite without email
- **WHEN** admin tries to submit the invite form without an email
- **THEN** client-side validation prevents submission and shows "Email is required"

### Requirement: Invite results show email delivery status
After invites are created, the UI SHALL show whether the email was sent for each invite. Successful sends show a sent indicator. Failed sends show the claim URL prominently with a note that the email could not be sent.

#### Scenario: Email sent successfully
- **WHEN** invite response has `email_sent: true`
- **THEN** a success indicator is shown (e.g., "Invite email sent")

#### Scenario: Email failed
- **WHEN** invite response has `email_sent: false`
- **THEN** the claim URL is shown prominently with a copy button and a note like "Email could not be sent — share this link manually"
