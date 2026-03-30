## Context

Run402's Google OAuth is zero-config. The flow uses PKCE (Proof Key for Code Exchange) in redirect mode:

1. Frontend generates a PKCE verifier + challenge
2. `POST /auth/v1/oauth/google/start` returns a Google `authorization_url`
3. User is redirected to Google, picks an account
4. Google redirects to Run402 callback, which redirects to the app: `https://app.run402.com/#code=xxx&state=yyy`
5. Frontend extracts `code` from the URL hash fragment, exchanges it via `POST /auth/v1/token?grant_type=authorization_code` with the PKCE verifier
6. Returns the same `{ access_token, refresh_token, user }` as password login

The current login page (`login.tsx`) is a simple email/password form. Auth state is managed in `auth.tsx` with session stored in `localStorage`.

## Goals / Non-Goals

**Goals:**
- Add Google sign-in to the existing login page as a secondary option
- Reuse the existing session management (same `access_token` + `refresh_token` flow)
- Handle the OAuth callback transparently on the login page

**Non-Goals:**
- Popup mode — redirect is more reliable (browser COOP policies block popup auto-close)
- Account linking (Google + password for same email) — Run402 returns `account_exists_requires_link` error; we'll show a helpful message
- Profile enrichment from Google (display_name, avatar_url) — nice-to-have, not in scope

## Decisions

### 1. OAuth callback on the login page itself

**Decision**: The OAuth redirect URL is `window.location.origin + '/login'`. The login page checks for `#code=` on mount and handles the token exchange.

**Why**: No new route needed. The login page already handles auth state transitions. After successful exchange, it redirects to `/app` the same way password login does.

**Alternative**: Dedicated `/oauth/callback` route. Rejected — adds a route for a single useEffect check.

### 2. PKCE helpers in auth.tsx

**Decision**: Add `generatePKCEVerifier()` and `generatePKCEChallenge()` to `auth.tsx` alongside the existing `login` and `signup` functions. Store the verifier in `sessionStorage` (not `localStorage`) since it's transient.

**Why**: Keeps all auth logic in one place. `sessionStorage` is scoped to the tab and auto-clears, which is appropriate for the short-lived PKCE verifier.

### 3. Google button placement

**Decision**: Place the Google button above the email/password form with a divider ("or").

**Why**: Google sign-in is the lower-friction option and should be visually prominent. Users who prefer email/password can scroll past it.

### 4. Error handling for account_exists_requires_link

**Decision**: Show a user-friendly message: "An account with this email already exists. Please sign in with your email and password."

**Why**: Run402 doesn't auto-merge accounts for security. The user needs to know what to do. No silent failure.

## Risks / Trade-offs

- **[Redirect flash]** User leaves the page during Google sign-in and returns. The login page may briefly flash before the callback is processed. → Mitigation: Check for `#code=` early in the component lifecycle and show a loading spinner during exchange.
- **[PKCE verifier lost]** If user clears session storage or opens a new tab during the flow, the verifier is lost and the exchange fails. → Mitigation: Show "Sign-in failed, please try again" and let them retry.
- **[Same email collision]** A user who signed up with email/password can't use Google with the same email. → Mitigation: Clear error message directing them to password login.
