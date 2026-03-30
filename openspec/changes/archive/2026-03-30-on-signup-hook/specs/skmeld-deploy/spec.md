## MODIFIED Requirements

### Requirement: Deploy includes on-signup function in bundle
The deploy script SHALL include `on-signup.ts` in the bundle deploy functions array. No schedule is needed — the Run402 gateway auto-discovers and invokes functions named `on-signup`.

#### Scenario: Bundle deploy includes on-signup
- **WHEN** the deploy script builds the functions array for the bundle payload
- **THEN** the array SHALL include `{ name: "on-signup", code: <contents of on-signup.ts> }`
