## MODIFIED Requirements

### Requirement: Functions list includes scheduled functions
The functions list in `deploy.ts` and documentation in `CLAUDE.md` SHALL include the two new scheduled functions: `check-sla-overdue` and `daily-digest`.

#### Scenario: Deploy includes new functions
- **WHEN** the deploy script reads function files
- **THEN** the `functionFiles` array SHALL include `check-sla-overdue.ts` and `daily-digest.ts`

#### Scenario: CLAUDE.md documents new functions
- **WHEN** the functions section of CLAUDE.md is read
- **THEN** it SHALL list `check-sla-overdue.ts` and `daily-digest.ts` with their purpose and schedule
