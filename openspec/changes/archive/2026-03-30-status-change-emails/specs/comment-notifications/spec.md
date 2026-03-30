## ADDED Requirements

### Requirement: Email other party on public comment
When a public comment is added to a maintenance request, the system SHALL email the other party (not the comment author).

#### Scenario: Staff adds public comment
- **WHEN** a staff member adds a public comment to a request
- **THEN** the system SHALL send an email to the requester with subject `[<app_name>] Request #<number> — New comment` and body containing a preview of the comment text

#### Scenario: Resident adds public comment
- **WHEN** a resident adds a public comment to their request
- **THEN** the system SHALL send an email to the assigned staff member, or to all `owner_admin` users if the request is unassigned

#### Scenario: Internal comment added
- **WHEN** a staff member adds an internal comment (visibility = "internal")
- **THEN** the system SHALL NOT send any email notification

#### Scenario: Comment author has no counterpart email
- **WHEN** the notification recipient has no email address on their profile
- **THEN** the system SHALL skip the notification without error

### Requirement: Fire-and-forget delivery
Email notification failures SHALL NOT block or fail the comment creation response.

#### Scenario: Email delivery fails on comment
- **WHEN** `email.send()` throws an error during comment notification
- **THEN** the comment SHALL still be created successfully
