## ADDED Requirements

### Requirement: Proactive token refresh before expiry
The system SHALL automatically refresh the JWT access token before it expires. The refresh MUST be scheduled approximately 5 minutes before the `expires_in` deadline. After a successful refresh, the new session (access_token, refresh_token, expires_in) MUST be persisted to localStorage and the refresh timer MUST be rescheduled.

#### Scenario: Token refreshed before expiry
- **WHEN** the proactive refresh timer fires (5 minutes before token expiry)
- **THEN** the system calls `POST /auth/v1/token` with `grant_type: "refresh_token"` and the stored refresh token, stores the new session in localStorage, and schedules a new refresh timer

#### Scenario: Proactive refresh fails
- **WHEN** the proactive refresh attempt returns an error (e.g., refresh token expired)
- **THEN** the system clears the session from localStorage and redirects to `/login?expired=true`

#### Scenario: Refresh timer cleared on logout
- **WHEN** the user clicks Sign out
- **THEN** the proactive refresh timer MUST be cancelled

### Requirement: 401 interception with refresh retry on all API calls
All API helper functions (`apiGet`, `apiPost`, `apiPatch`, `apiDelete`, `invokeFunction`) SHALL intercept HTTP 401 responses. On receiving a 401, the system MUST attempt one token refresh. If the refresh succeeds, the original request MUST be retried with the new token. If the refresh fails, the system MUST trigger a forced logout.

#### Scenario: Single API call gets 401, refresh succeeds
- **WHEN** an API call returns 401
- **THEN** the system refreshes the token, retries the original request with the new access_token, and returns the retried response to the caller

#### Scenario: Single API call gets 401, refresh fails
- **WHEN** an API call returns 401 and the subsequent refresh attempt also fails
- **THEN** the system clears the session and redirects to `/login?expired=true`

#### Scenario: Multiple concurrent 401s share one refresh
- **WHEN** multiple API calls receive 401 at approximately the same time
- **THEN** only one refresh request is made; all pending retries await the same refresh promise

### Requirement: Session-expired message on login page
The login page SHALL display a "Your session expired. Please sign in again." message when the user arrives via forced logout.

#### Scenario: Redirected after session expiry
- **WHEN** the login page loads with `?expired=true` in the URL
- **THEN** a visible message "Your session expired. Please sign in again." is displayed above the login form

#### Scenario: Normal login page load
- **WHEN** the login page loads without the `expired` query parameter
- **THEN** no session-expired message is displayed

### Requirement: Refresh timer initialized on app load with existing session
When the app loads with a valid stored session, the system SHALL calculate the remaining time until token expiry and schedule a proactive refresh accordingly. If the token is already expired or will expire within 5 minutes, the system SHALL attempt an immediate refresh.

#### Scenario: App loads with token expiring in 30 minutes
- **WHEN** the app loads and the stored token has 30 minutes remaining
- **THEN** a refresh timer is scheduled for 25 minutes from now (30min - 5min buffer)

#### Scenario: App loads with token already expired
- **WHEN** the app loads and the stored token's expiry time has passed
- **THEN** the system immediately attempts a refresh; if it fails, redirects to `/login?expired=true`

### Requirement: Auth context supports OAuth login
The auth context SHALL expose a `loginWithGoogle()` function that initiates the PKCE-based Google OAuth redirect flow, and a `handleOAuthCallback()` function that completes the flow by exchanging the authorization code for tokens.

#### Scenario: loginWithGoogle initiates redirect
- **WHEN** `loginWithGoogle()` is called
- **THEN** the auth context SHALL generate PKCE credentials, call the Google start endpoint, and redirect the browser to Google's consent screen

#### Scenario: handleOAuthCallback completes login
- **WHEN** `handleOAuthCallback()` is called with a valid code in the URL hash
- **THEN** it SHALL exchange the code for tokens, store the session in localStorage (same format as password login), schedule token refresh, and return the user object

#### Scenario: handleOAuthCallback with no code
- **WHEN** `handleOAuthCallback()` is called but no code is in the URL hash
- **THEN** it SHALL return null without side effects
