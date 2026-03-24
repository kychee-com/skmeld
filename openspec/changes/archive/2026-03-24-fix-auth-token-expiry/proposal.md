## Why

Users are silently logged out after 1 hour when the JWT expires. The app continues to show an authenticated layout but all API calls return 401, resulting in an empty sidebar, empty board, and zero error feedback. The stored `refresh_token` is never used. Users must manually discover the problem and re-login. This is the #1 and #2 bug from the SkMeld test plan.

## What Changes

- Add automatic token refresh using the stored `refresh_token` before the JWT expires
- Add 401 interception to all API helpers (`apiGet`, `apiPost`, `apiPatch`, `apiDelete`, `invokeFunction`) — on 401, attempt one token refresh; if that fails, clear session and redirect to `/login`
- Show a brief "Session expired — please sign in again" message on the login page when the user is redirected due to expiry
- Add a proactive refresh timer that renews the token ~5 minutes before expiration

## Capabilities

### New Capabilities
- `auth-token-refresh`: Automatic JWT refresh using refresh_token, 401 interception across all API calls, and session-expired redirect flow

### Modified Capabilities
- `skmeld-frontend`: Login page gains a "session expired" message shown after forced logout. API client gains 401 retry-with-refresh logic.

## Impact

- `src/lib/auth.tsx` — Add refresh logic, expiration timer, and forced-logout function
- `src/api/client.ts` — Add 401 interception with refresh-and-retry to all API helpers
- `src/pages/login.tsx` — Show "session expired" message when redirected from expired session
- No backend changes required — the Run402 auth API already supports `refresh_token` grant type
- No breaking changes
