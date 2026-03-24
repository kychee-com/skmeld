## MODIFIED Requirements

### Requirement: Login page displays contextual messages
The login page SHALL display contextual feedback messages based on URL parameters. When `?expired=true` is present, the page MUST show "Your session expired. Please sign in again." in a visible banner above the form. The parameter MUST be removed from the URL after being read so it does not persist on reload.

#### Scenario: Session expired redirect
- **WHEN** the user is redirected to `/login?expired=true` after a forced logout
- **THEN** the login page shows "Your session expired. Please sign in again." in an info-styled banner

#### Scenario: Login error after expired message
- **WHEN** the user sees the expired message and then submits invalid credentials
- **THEN** the expired message is replaced by the "Invalid credentials" error message
