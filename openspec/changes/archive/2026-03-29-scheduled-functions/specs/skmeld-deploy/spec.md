## MODIFIED Requirements

### Requirement: Deploy scheduled functions via post-deploy API call
The deploy script SHALL deploy scheduled functions as part of the bundle (for code), then set their cron schedules via the Run402 admin API after the bundle deploy completes.

#### Scenario: Deploy with scheduled functions
- **WHEN** the deploy script runs
- **THEN** it SHALL include `check-sla-overdue` and `daily-digest` in the bundle's functions array, and after a successful deploy, call `POST /projects/v1/admin/:id/functions/:name` with the schedule config for each scheduled function

#### Scenario: Schedule configuration
- **WHEN** setting the schedule for `check-sla-overdue`
- **THEN** the deploy script SHALL set the cron expression to `0 */4 * * *` (every 4 hours)

#### Scenario: Schedule configuration for daily digest
- **WHEN** setting the schedule for `daily-digest`
- **THEN** the deploy script SHALL set the cron expression to `0 7 * * *` (daily at 7:00 AM UTC)
