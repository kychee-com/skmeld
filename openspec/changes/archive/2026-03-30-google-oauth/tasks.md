## 1. PKCE Helpers

- [x] 1.1 Add `generatePKCEVerifier()` and `generatePKCEChallenge(verifier)` functions to `src/lib/auth.tsx` using `crypto.getRandomValues` and `crypto.subtle.digest`

## 2. Auth Context

- [x] 2.1 Add `loginWithGoogle()` to the auth context — generates PKCE, stores verifier in `sessionStorage`, calls `POST /auth/v1/oauth/google/start`, redirects to `authorization_url`
- [x] 2.2 Add `handleOAuthCallback()` to the auth context — checks URL hash for `code`, exchanges via `POST /auth/v1/token?grant_type=authorization_code` with PKCE verifier, stores session, schedules refresh
- [x] 2.3 Expose `loginWithGoogle` and `handleOAuthCallback` from the `AuthContext` provider

## 3. Login Page

- [x] 3.1 Add Google sign-in button above the email/password form with an "or" divider
- [x] 3.2 Call `handleOAuthCallback()` in a `useEffect` on mount — if code found, show loading spinner, complete exchange, redirect to `/app`
- [x] 3.3 Handle `account_exists_requires_link` error with a friendly message directing user to email/password login

## 4. Claim Page

- [x] 4.1 Add Google sign-in option to the claim page signup step as an alternative to email/password registration
