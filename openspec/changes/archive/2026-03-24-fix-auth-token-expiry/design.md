## Context

SkMeld uses Run402's JWT-based auth. The frontend stores `access_token`, `refresh_token`, and `expires_in` in localStorage as `skmeld_session`. The `access_token` expires after 3600s (1 hour). Currently:

- `src/lib/auth.tsx` reads the session from localStorage on mount but never refreshes the token
- `src/api/client.ts` attaches the stored token to every request but has no 401 handling
- When the token expires, all API calls return 401, the profile fetch fails silently, and the UI breaks (empty sidebar, empty board, no error)
- The `refresh_token` is stored but never used

The Run402 auth API supports `POST /auth/v1/token` with `grant_type: "refresh_token"` to get a new access token.

## Goals / Non-Goals

**Goals:**
- Automatically refresh the JWT before it expires so users stay logged in across long sessions
- On 401 from any API call, attempt one refresh; if it fails, log out and redirect to login
- Show a clear "Session expired" message on the login page after forced logout
- Keep the solution simple — no external state management or complex retry queues

**Non-Goals:**
- Multi-tab session synchronization (can add later)
- Offline/background token refresh when the tab is inactive
- Changing the backend auth configuration or token lifetime
- Adding a "remember me" feature

## Decisions

### 1. Proactive refresh via setTimeout

Refresh the token proactively ~5 minutes before expiration using `setTimeout`. This avoids most 401s entirely.

**Why not just rely on 401 interception?** — Reactive-only refresh means every API call made after expiry will fail once, then retry. With 15-second polling on the board, this would cause a visible flicker. Proactive refresh avoids this entirely.

**Why not setInterval?** — A single `setTimeout` scheduled after each token acquisition is simpler and doesn't accumulate stale timers. The timer is cleared on logout.

### 2. 401 interception as fallback in api/client.ts

Add a wrapper that catches 401 responses, attempts a token refresh, and retries the original request once. If refresh fails, trigger forced logout.

**Why in client.ts, not an axios interceptor?** — The app uses raw `fetch`, not axios. Adding a small wrapper function around the existing helpers is simpler than adding a new dependency.

**Approach:** Create a single `fetchWithAuth` function that wraps `fetch` and handles 401 → refresh → retry. All existing `apiGet`/`apiPost`/etc. call this instead of raw `fetch`.

### 3. Forced logout via event-based coordination

Use a module-level callback (`onSessionExpired`) that `auth.tsx` registers during initialization. When `client.ts` detects an unrecoverable 401, it calls this callback. This avoids circular imports between `client.ts` and `auth.tsx`.

**Alternative considered:** Having `client.ts` directly manipulate localStorage and `window.location`. Rejected because it bypasses React state, leaving the auth context stale.

### 4. Session-expired flag via URL search param

When forced logout happens, redirect to `/login?expired=true`. The login page reads this param and shows "Your session expired. Please sign in again." This is stateless and survives page reloads.

**Alternative considered:** Using localStorage flag. Rejected because it requires cleanup logic and can persist across browser sessions.

## Risks / Trade-offs

- **Race condition on concurrent 401s** → Mitigated by using a single in-flight refresh promise. If multiple requests get 401 simultaneously, they all await the same refresh call rather than each triggering their own.
- **Refresh token also expired** → The refresh attempt will fail with 401, triggering forced logout. User sees the "session expired" message and must re-login. This is the expected degraded experience.
- **Timer drift if device sleeps** → The setTimeout may fire late if the device was asleep. The 401 fallback catches this case — the next API call will trigger refresh reactively.
