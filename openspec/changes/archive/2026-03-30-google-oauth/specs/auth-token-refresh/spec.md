## MODIFIED Requirements

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
