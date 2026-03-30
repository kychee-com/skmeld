## Requirements

### Requirement: Email requester on status change
When a maintenance request's status changes, the system SHALL send an email notification to the requester with the new status and any public note.

#### Scenario: Staff moves request to "in progress"
- **WHEN** a staff member transitions a request to "in_progress"
- **THEN** the system SHALL send an email to the requester with subject `[<app_name>] Request #<number> — In progress` and body containing the request title and new status

#### Scenario: Staff resolves request with summary
- **WHEN** a staff member transitions a request to "resolved" with a resolution summary
- **THEN** the email body SHALL include the resolution summary text

#### Scenario: Status change with public note
- **WHEN** a status transition includes a public note
- **THEN** the email body SHALL include the public note text

#### Scenario: Requester acts on own request
- **WHEN** the requester (resident) transitions their own request (e.g., closing a resolved request)
- **THEN** the system SHALL email the assigned staff member instead of the requester

#### Scenario: No requester email on profile
- **WHEN** the requester's profile has no email address
- **THEN** the system SHALL skip the notification without error

### Requirement: Fire-and-forget delivery
Email notification failures SHALL NOT block or fail the status transition response.

#### Scenario: Email delivery fails
- **WHEN** `email.send()` throws an error during a status transition
- **THEN** the transition SHALL still complete successfully and the error SHALL be silently caught
