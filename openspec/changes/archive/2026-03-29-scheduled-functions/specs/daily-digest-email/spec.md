## ADDED Requirements

### Requirement: Daily digest email to staff
The system SHALL run a scheduled function `daily-digest` once per day (7:00 AM UTC) that sends a summary email to all users with `role_key` of `staff` or `owner_admin`.

#### Scenario: Digest with open requests
- **WHEN** the daily digest runs and there are open maintenance requests
- **THEN** the system SHALL send an HTML email to each staff/admin user containing: total open request count, number of overdue requests, number of requests awaiting first response, and a list of requests assigned to that user

#### Scenario: No open requests
- **WHEN** the daily digest runs and there are zero open maintenance requests
- **THEN** the system SHALL skip sending emails (no "all clear" spam)

### Requirement: Digest email content
The digest email SHALL be sent using raw HTML mode via `email.send({ to, subject, html, from_name })` with the app name as `from_name`.

#### Scenario: Email format
- **WHEN** a digest email is composed
- **THEN** the subject SHALL be `"[<app_name>] Daily Summary — <date>"` and the body SHALL include a summary section with aggregate counts and a per-request table with columns: request number, title, priority, status, age, and assignee

#### Scenario: Staff member with no assigned requests
- **WHEN** a staff member has no requests assigned to them but other open requests exist
- **THEN** the digest email SHALL still include the aggregate summary section but the "your requests" section SHALL say "No requests assigned to you"
