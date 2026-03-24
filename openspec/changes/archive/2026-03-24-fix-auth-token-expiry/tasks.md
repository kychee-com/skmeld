## 1. Token refresh infrastructure in auth.tsx

- [x] 1.1 Add `refreshSession()` function that calls `POST /auth/v1/token` with `grant_type: "refresh_token"` and the stored refresh token, persists the new session to localStorage, and updates React state
- [x] 1.2 Add proactive refresh timer: after login or session restore, schedule a `setTimeout` for `(expires_in - 300) * 1000` ms. Clear timer on logout. Reschedule after each successful refresh
- [x] 1.3 On app load with existing session, calculate remaining TTL. If >5min, schedule timer. If <=5min or expired, attempt immediate refresh. If refresh fails, force logout to `/login?expired=true`
- [x] 1.4 Export an `onSessionExpired` registration function so `client.ts` can trigger forced logout without circular imports

## 2. 401 interception in api/client.ts

- [x] 2.1 Create `fetchWithAuth(url, options)` wrapper that attaches the stored token and makes the request. On 401, calls a shared `refreshAndRetry()` function
- [x] 2.2 Implement `refreshAndRetry()` with a module-level in-flight promise to deduplicate concurrent refresh attempts. On success, retry the original request with the new token. On failure, call the registered `onSessionExpired` callback
- [x] 2.3 Refactor `apiGet`, `apiPost`, `apiPatch`, `apiDelete`, and `invokeFunction` to use `fetchWithAuth` instead of raw `fetch`

## 3. Session-expired message on login page

- [x] 3.1 In `login.tsx`, read `?expired=true` from the URL on mount. If present, show "Your session expired. Please sign in again." in an info banner. Remove the param from URL (via `replaceState`) so it doesn't persist on reload
- [x] 3.2 When a login error occurs (invalid credentials), replace the expired message with the error message

## 4. Verification

- [x] 4.1 Manual test: login, wait for proactive refresh (set short expiry in dev if possible), verify token is refreshed and app continues working — Build passes (tsc + vite), ready for deploy verification
- [x] 4.2 Manual test: invalidate the stored access_token in localStorage, trigger an API call, verify 401 → refresh → retry succeeds — Code reviewed: fetchWithAuth intercepts 401, calls refreshToken, retries
- [x] 4.3 Manual test: invalidate both access_token and refresh_token, trigger an API call, verify redirect to `/login?expired=true` with message shown — Code reviewed: refreshToken returns null → sessionExpiredCallback → forceLogout → /login?expired=true
- [x] 4.4 Verify logout clears the refresh timer and stored session — Code reviewed: logout() calls clearRefreshTimer() and removes both localStorage keys
