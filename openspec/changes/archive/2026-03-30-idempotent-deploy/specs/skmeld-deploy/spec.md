## MODIFIED Requirements

### Requirement: Deploy reuses project from app.json
The deploy script SHALL save the project credentials to `app.json` on first deploy and reuse them on subsequent deploys, deploying to the same Run402 project.

#### Scenario: First deploy
- **WHEN** no `app.json` exists
- **THEN** the deploy script SHALL create a new project, save credentials to `app.json`, and deploy to it

#### Scenario: Subsequent deploy
- **WHEN** `app.json` exists with valid project credentials
- **THEN** the deploy script SHALL skip project creation and deploy directly to the existing project
