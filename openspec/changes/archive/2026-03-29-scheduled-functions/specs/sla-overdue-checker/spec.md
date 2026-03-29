## ADDED Requirements

### Requirement: Scheduled SLA overdue detection
The system SHALL run a scheduled function `check-sla-overdue` on a cron schedule (every 4 hours) that queries `maintenance_requests` for open requests past their SLA deadlines and not yet notified.

#### Scenario: Request with overdue first response
- **WHEN** a maintenance request has `first_response_due_at` in the past AND `first_responded_at` is NULL AND `is_overdue_notified` is false
- **THEN** the function SHALL insert a `request_events` row with event_type `sla_overdue_response`, set `is_overdue_notified` to true, and send a notification email

#### Scenario: Request with overdue resolution
- **WHEN** a maintenance request has `resolution_due_at` in the past AND `resolved_at` is NULL AND the status is open AND `is_overdue_notified` is false
- **THEN** the function SHALL insert a `request_events` row with event_type `sla_overdue_resolution`, set `is_overdue_notified` to true, and send a notification email

#### Scenario: Already notified request
- **WHEN** a maintenance request has `is_overdue_notified` set to true
- **THEN** the function SHALL skip it without sending another email or logging another event

#### Scenario: No overdue requests
- **WHEN** no open requests have passed their SLA deadlines
- **THEN** the function SHALL complete successfully with no side effects

### Requirement: Batched overdue notification emails
The system SHALL batch overdue notifications per staff member, sending one email listing all their newly overdue requests rather than one email per request.

#### Scenario: Staff member with multiple overdue assigned requests
- **WHEN** the SLA check finds 3 overdue requests assigned to the same staff member
- **THEN** the system SHALL send one email to that staff member listing all 3 requests

#### Scenario: Unassigned overdue request
- **WHEN** an overdue request has no `assignee_user_id`
- **THEN** the system SHALL include it in a notification email sent to all users with `role_key` of `owner_admin`

### Requirement: Schema addition for overdue tracking
The system SHALL add an `is_overdue_notified` boolean column (default false) to the `maintenance_requests` table.

#### Scenario: New request created
- **WHEN** a new maintenance request is inserted
- **THEN** `is_overdue_notified` SHALL default to false

#### Scenario: Request SLA deadline extended
- **WHEN** a request's SLA deadline is updated to a future date via `update-request`
- **THEN** `is_overdue_notified` SHALL be reset to false so the new deadline can trigger a fresh notification
