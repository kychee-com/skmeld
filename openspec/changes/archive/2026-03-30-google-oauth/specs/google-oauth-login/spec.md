## ADDED Requirements

### Requirement: Sign in with Google button
The login page SHALL display a "Sign in with Google" button above the email/password form, separated by an "or" divider.

#### Scenario: User clicks Sign in with Google
- **WHEN** the user clicks the Google sign-in button
- **THEN** the system SHALL generate a PKCE verifier and challenge, store the verifier in `sessionStorage`, call `POST /auth/v1/oauth/google/start` with the challenge and redirect URL, and navigate the browser to the returned `authorization_url`

### Requirement: OAuth callback handling
The login page SHALL check for an OAuth authorization code in the URL hash fragment on mount and exchange it for tokens.

#### Scenario: Successful Google sign-in redirect
- **WHEN** the login page loads with `#code=xxx&state=yyy` in the URL
- **THEN** the system SHALL extract the code, retrieve the PKCE verifier from `sessionStorage`, call `POST /auth/v1/token?grant_type=authorization_code` with the code and verifier, store the returned session, and redirect to `/app`

#### Scenario: Loading state during token exchange
- **WHEN** the login page detects an OAuth code in the URL hash
- **THEN** the system SHALL display a loading indicator and disable the login form until the exchange completes or fails

#### Scenario: OAuth exchange fails
- **WHEN** the token exchange returns an error
- **THEN** the system SHALL clear the URL hash, display the error message, and show the normal login form

### Requirement: Account exists error handling
The system SHALL display a helpful message when a Google account's email matches an existing password account.

#### Scenario: Google email matches existing password account
- **WHEN** the OAuth flow returns an `account_exists_requires_link` error
- **THEN** the system SHALL display "An account with this email already exists. Please sign in with your email and password."

### Requirement: PKCE utilities
The auth module SHALL provide PKCE helper functions using browser `crypto.subtle`.

#### Scenario: Generate PKCE verifier
- **WHEN** `generatePKCEVerifier()` is called
- **THEN** it SHALL return a 43-character URL-safe base64 string generated from 32 random bytes

#### Scenario: Generate PKCE challenge
- **WHEN** `generatePKCEChallenge(verifier)` is called
- **THEN** it SHALL return the SHA-256 hash of the verifier as a URL-safe base64 string
