## MODIFIED Requirements

### Requirement: Functions list includes on-signup hook
The functions list in `deploy.ts` and documentation in `CLAUDE.md` SHALL include the `on-signup` lifecycle hook function.

#### Scenario: Deploy includes on-signup function
- **WHEN** the deploy script reads function files
- **THEN** the `functionFiles` array SHALL include `on-signup.ts`

#### Scenario: CLAUDE.md documents on-signup function
- **WHEN** the functions section of CLAUDE.md is read
- **THEN** it SHALL list `on-signup.ts` as a Run402 lifecycle hook that auto-creates resident profiles on signup
