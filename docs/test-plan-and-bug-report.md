# SkMeld Test Plan & Bug Report

**Date**: 2026-03-24
**Target**: https://skmeld.run402.com
**Method**: Browser automation (Chrome) + code review
**Tester**: Claude Code (automated)

---

## Test Plan

### TP-1: Authentication

| # | Test Case | Steps | Expected | Actual | Status |
|---|-----------|-------|----------|--------|--------|
| 1.1 | Login with valid credentials | Enter admin email/password, click Sign in | Redirect to /app/board | Redirects to /app/board, sidebar + board load correctly | **PASS** |
| 1.2 | Login with invalid credentials | Enter invalid@test.com / wrongpassword, submit | Show error message | "Invalid credentials" shown in pink banner | PASS |
| 1.3 | Login with empty fields | Click Sign in without filling fields | Browser validation or custom error | Browser native `required` validation fires | PASS (minimal) |
| 1.4 | Session expiration handling | Let JWT expire (>1 hour), reload page | Redirect to login or show re-auth prompt | App stays on /app/board with empty sidebar, empty board, no error | **FAIL** |
| 1.5 | Logout | Click "Sign out" in sidebar | Clear session, redirect to /login | Redirects to /login correctly | PASS |
| 1.6 | Protected route without auth | Navigate to /app/settings while logged out | Redirect to /login | Redirects to /login | PASS |
| 1.7 | Redirect back after login | Navigate to /app/settings → redirected to /login → login | Return to /app/settings | Redirects to /app/board (no return-to logic) | **FAIL** |

### TP-2: Navigation & Routing

| # | Test Case | Steps | Expected | Actual | Status |
|---|-----------|-------|----------|--------|--------|
| 2.1 | Sidebar nav items render (fresh session) | Login as owner_admin, check sidebar | Board, Report Issue, Properties, People, Vendors, Reports, Settings | All 7 nav items render correctly | **PASS** |
| 2.1b | Sidebar nav items render (expired session) | Let JWT expire, reload | Nav items or redirect to login | Sidebar completely empty, no error | **FAIL** (see BUG-001) |
| 2.2 | 404 page for unknown routes | Navigate to /nonexistent-page | Show 404 page | Redirects to /login (no dedicated 404 page) | **FAIL** |
| 2.3 | Mobile sidebar hamburger | View on mobile viewport, tap hamburger | Sidebar slides in | Could not fully test (Chrome extension interference) | BLOCKED |
| 2.4 | Sidebar user info (fresh session) | Check sidebar footer | Show user name/email and role | Shows "Admin" / "Owner Admin" correctly | **PASS** |
| 2.5 | Board card click navigation | Click a card on the board | Navigate to /app/requests/:id | Card does not navigate — dnd-kit listeners intercept click | **FAIL** |
| 2.6 | /app/people via direct URL | Navigate directly to /app/people | Show People page | Redirects to /app/board (RoleRoute race condition) | **FAIL** |
| 2.7 | /app/settings via direct URL | Navigate directly to /app/settings | Show Settings page | Redirects to /app/board (RoleRoute race condition) | **FAIL** |
| 2.8 | /app/people via SPA sidebar nav | Click People in sidebar | Show People page | Works correctly (profile already loaded) | **PASS** |
| 2.9 | /app/settings via SPA sidebar nav | Click Settings in sidebar | Show Settings page | Works correctly | **PASS** |

### TP-3: Invite / Claim Flow

| # | Test Case | Steps | Expected | Actual | Status |
|---|-----------|-------|----------|--------|--------|
| 3.1 | Claim page without token | Navigate to /claim | Show "missing token" error | "Invalid Link — This invite link is missing a token." | PASS |
| 3.2 | Claim page with invalid token | Navigate to /claim?token=fake-token | Validate token, show error | Shows signup form without validating token first | **FAIL** |
| 3.3 | Claim page with expired token | Navigate to /claim?token=expired | Show "expired" error | Not tested (no real tokens available) | BLOCKED |

### TP-4: Board (Kanban)

| # | Test Case | Steps | Expected | Actual | Status |
|---|-----------|-------|----------|--------|--------|
| 4.1 | Board loads with columns | Login, view /app/board | Show status columns with cards | Shows New(1), Under review(3), Scheduled(0), In progress(1), Waiting on you(0)+ columns with cards | **PASS** |
| 4.1b | Board with expired token | Reload with expired JWT | Show error or redirect | Board shows empty columns, no error feedback | **FAIL** (see BUG-001) |
| 4.2 | Board empty columns | View column with no cards | Show "No requests" indicator | Shows "No requests" text in empty columns | **PASS** |
| 4.3 | Board search | Type "faucet" in search field | Filter cards matching "faucet" | Correctly shows only "Kitchen faucet dripping" card, filter badge shows 1 | **PASS** |
| 4.4 | Board filters clear | Click "Clear" after search | Reset filters | Filter clears, badge shown with clear button | **PASS** |
| 4.5 | Board card click to detail | Click a card on the board | Navigate to request detail | Does NOT navigate — dnd-kit drag listeners intercept click events | **FAIL** |
| 4.6 | Drag/drop card | Drag card between columns | Transition request status | Not tested (card click intercepted) | BLOCKED |

### TP-5: Request Lifecycle

| # | Test Case | Steps | Expected | Actual | Status |
|---|-----------|-------|----------|--------|--------|
| 5.1 | Report Issue form loads | Navigate to /app/report | Show form with property, category, title, details, etc. | Full form renders: Property dropdown, 10 category chips, title, details, location, priority, entry pref, pets, visit window, access instructions, photos, submit button | **PASS** |
| 5.2 | View request detail via URL | Navigate to /app/requests/req_demo_03 | Show request detail page | Shows #1003 "Dishwasher not draining" with description, location, requester, date, status actions (Schedule, Start Work, Wait on Vendor, etc.), activity timeline, comment composer with Public/Internal toggle | **PASS** |
| 5.3 | View request detail via board card | Click card on board | Navigate to request detail | Fails — card click intercepted by drag handler | **FAIL** (see BUG-026) |
| 5.4 | Add comment | Type comment, submit | Comment appears in timeline | Not fully tested (would need to submit data) | DEFERRED |
| 5.5 | Transition request | Click status action button | Status changes, event logged | Not fully tested | DEFERRED |

### TP-6: Admin Pages

| # | Test Case | Steps | Expected | Actual | Status |
|---|-----------|-------|----------|--------|--------|
| 6.1 | Properties page | Navigate to /app/properties | Show property list | Shows 2 properties (Maplewood Townhomes, Oakridge Apartments) with space counts, edit/archive icons, Add Property button | **PASS** |
| 6.2 | People page (direct URL) | Navigate to /app/people | Show people/invites | Redirects to /app/board (RoleRoute race condition with async profile) | **FAIL** |
| 6.2b | People page (SPA nav) | Click People in sidebar | Show people/invites | Shows Active Users (1: Admin) and Pending Invites (1) tabs, Invite button | **PASS** |
| 6.3 | Vendors page | Navigate to /app/vendors | Show vendor list | Shows 2 vendors (Ace Plumbing, Spark Electric) with trade badges, contact info, edit icons, Add Vendor button | **PASS** |
| 6.4 | Reports page | Navigate to /app/reports | Show metrics dashboard | Shows 4 metric cards (5 Open, 0 Overdue, 5 Unassigned, 8.0h Avg First Response), Requests by Status chart, Export CSV button | **PASS** |
| 6.5 | Settings page (direct URL) | Navigate to /app/settings | Show app settings form | Redirects to /app/board (RoleRoute race condition) | **FAIL** |
| 6.5b | Settings page (SPA nav) | Click Settings in sidebar | Show app settings form | Shows General settings (App Name, Company, Support, Time Zone, Emergency Instructions), Theme selector (5 colors), Intake Form toggles, Save button | **PASS** |

---

## Bug Report

### Severity Definitions

- **P0 — Critical**: App unusable or major feature completely broken
- **P1 — High**: Important feature degraded, poor UX that blocks workflows
- **P2 — Medium**: Non-blocking bugs, UX issues, missing feedback
- **P3 — Low**: Minor polish, edge cases, nice-to-haves

---

### P0 — Critical

#### BUG-001: Expired JWT causes silent app failure — empty sidebar and board

**Observed**: When the JWT expires (after 1 hour), the app shows an authenticated-looking layout (sidebar + board) but all API calls return 401. The sidebar navigation is completely empty, the board shows no columns or cards, and there is zero user-facing feedback.

**Root cause chain**:
1. `src/lib/auth.tsx:47-55` — `loadProfile()` fetches profile but the catch block (line 53) silently swallows errors
2. With `profile === null`, the nav filter at `src/components/app-layout.tsx:42-44` returns zero items
3. `src/components/app-layout.tsx:91-93` — footer displays empty strings for name/role since `profile` is null
4. Board API calls (`request_statuses`, `v_request_board`) return 401 but no error is shown

**Expected**: When a 401 is received on any API call, the app should clear the session and redirect to `/login` with a "Session expired, please sign in again" message.

**Impact**: Any user who leaves the app open for >1 hour will see a completely broken, blank interface with no indication of what went wrong. They must manually notice, figure out to sign out, and re-login.

**Files**:
- `src/lib/auth.tsx:47-55` (silent error swallowing)
- `src/api/client.ts:14-26` (no 401 interception)
- `src/components/app-layout.tsx:42-44` (renders empty nav without fallback)

---

#### BUG-002: No token refresh mechanism

**Observed**: JWT `expires_in: 3600` (1 hour). No refresh token rotation or automatic token renewal.

**Root cause**: `src/lib/auth.tsx` stores `refresh_token` in localStorage (line 20) but never uses it. No timer or interceptor to refresh before expiration.

**Expected**: Either refresh the token proactively before expiration, or use the refresh_token when a 401 is received.

**Impact**: Sessions are limited to 1 hour. Combined with BUG-001, this causes complete app failure after 1 hour with no recovery path.

**Files**:
- `src/lib/auth.tsx:58-69` (stores session but no refresh logic)
- `src/api/client.ts:4-12` (no token validation or refresh on use)

---

#### BUG-003: Invite functions not deployed — invite system non-functional

**Observed**: Per the deployment report (`docs/deployment-report-2026-03-22.md`), the `create-invites` and `redeem-invite` functions could not be deployed due to a 5-function limit on the prototype tier.

**Impact**: The entire invite/onboarding flow is broken. Admins cannot invite new users (staff or residents). The `/claim` page will always fail even with a valid-looking token since `redeem-invite` doesn't exist on the server.

**Files**:
- `docs/deployment-report-2026-03-22.md:40-48`
- `functions/create-invites.ts`, `functions/redeem-invite.ts` (not deployed)

---

### P0 — Critical (continued)

#### BUG-026: Board card clicks don't navigate — dnd-kit drag listeners intercept onClick

**Observed**: Clicking any card on the board kanban does NOT navigate to the request detail page. The card stays in place and the URL doesn't change.

**Root cause**: `src/components/board-card.tsx:41` — `{...listeners}` from `useDraggable()` spreads `onPointerDown`/`onMouseDown` handlers onto the card `<div>`. These drag event handlers intercept/consume pointer events, preventing the `onClick` handler (line 43) from firing.

**Expected**: Clicking a card should navigate to `/app/requests/:id`. The only way to reach request detail is currently by manually typing the URL.

**Impact**: Users cannot access any request details from the board — the primary workflow path. This effectively breaks the core feature of the app.

**Fix**: Add `activationConstraint: { distance: 5 }` to the `useSensor(PointerSensor)` config in `board.tsx`, which tells dnd-kit to only start dragging after 5px of movement, allowing clicks to pass through.

**File**: `src/components/board-card.tsx:27-29,41-43`, `src/pages/board.tsx` (sensor config)

---

#### BUG-027: RoleRoute redirects before profile loads — People and Settings pages inaccessible via URL

**Observed**: Navigating directly to `/app/people` or `/app/settings` (via URL bar, bookmark, or page refresh) always redirects to `/app/board`. The pages only work via SPA sidebar navigation.

**Root cause**: `src/App.tsx:23-27` — `RoleRoute` checks `profile.role_key` synchronously on render. But `profile` is fetched asynchronously (triggered by `useEffect` in `auth.tsx:71-75`). On page load:
1. `user` is set synchronously from localStorage (line 62)
2. `profile` is null (async fetch hasn't completed)
3. `RoleRoute` sees `!profile` → redirects to `/app` → redirects to `/app/board`
4. Profile fetch completes, but user is already on `/app/board`

**Expected**: `RoleRoute` should show a loading spinner while `profile` is being fetched, similar to how `ProtectedRoute` shows a spinner while `loading` is true.

**Impact**: Any URL containing `/app/people` or `/app/settings` is effectively broken. Bookmarks, shared links, and page refreshes all fail silently. Only sidebar SPA navigation works (because profile is already loaded by then).

**File**: `src/App.tsx:23-27`

---

### P1 — High

#### BUG-004: Claim page doesn't validate token before showing signup form

**Observed**: Navigating to `/claim?token=fake-invalid-token` shows the full "Create your account to get started" signup form. Token is only validated on form submission.

**Expected**: Validate the token on page load. If invalid/expired, show an error immediately instead of letting users fill out the form.

**Impact**: Users click an invite link with an invalid/expired token, fill out the form, and only then discover the link is bad.

**File**: `src/pages/claim.tsx:17-36`

---

#### BUG-005: Board has no empty state

**Observed**: When the board has no requests (or when data fails to load), it shows a completely blank white area. No columns, no message, nothing.

**Expected**: Show either the status columns with "No requests" indicators, or a helpful empty state like "No maintenance requests yet. Create one with Report Issue."

**File**: `src/pages/board.tsx`

---

#### BUG-006: No 404 page

**Observed**: Navigating to any unknown route (e.g., `/nonexistent-page`) silently redirects to the login page.

**Expected**: Show a dedicated 404 page with a "Page not found" message and link back to the app.

**File**: `src/App.tsx` (missing catch-all route with 404 component)

---

#### BUG-007: No redirect-back-after-login

**Observed**: Navigating to `/app/settings` while logged out redirects to `/login`. After logging in, the user lands on `/app/board` instead of the originally requested `/app/settings`.

**Expected**: Store the intended destination and redirect there after successful login.

**Files**: `src/App.tsx`, `src/lib/auth.tsx`

---

#### BUG-008: Race condition in board drag-drop with optimistic updates

**Observed** (code review): `src/pages/board.tsx:42-67` — Optimistic update on line 53-54 changes card status immediately. If the `transition-request` function call fails, the card shows the wrong status until the next refetch (line 65). No error toast is shown.

**Expected**: On transition failure, immediately revert the optimistic update and show an error notification.

**File**: `src/pages/board.tsx:42-67`

---

#### BUG-009: Memory leak in photo upload previews

**Observed** (code review): `src/pages/report.tsx:207` — `URL.createObjectURL(photo)` creates blob URLs for photo previews but never calls `URL.revokeObjectURL()`. These accumulate in memory.

**Expected**: Revoke object URLs when photos are removed or component unmounts.

**File**: `src/pages/report.tsx:207`

---

### P2 — Medium

#### BUG-010: ANON_KEY defaults to empty string

**Observed**: `src/api/client.ts:2` — `VITE_ANON_KEY || ""`. If the env var is not set, all API calls send an empty `apikey` header. No startup warning.

**Expected**: Log a console error on startup if ANON_KEY is empty, or throw an error.

**File**: `src/api/client.ts:2`

---

#### BUG-011: Vendor trade categories are hardcoded

**Observed** (code review): `src/pages/vendors.tsx:46-60` — Trade categories are a hardcoded array instead of fetched from the `trade_categories` API.

**Expected**: Query the database for categories so admin-added categories appear automatically.

**File**: `src/pages/vendors.tsx:46-60`

---

#### BUG-012: Properties page missing form validation

**Observed** (code review): `src/pages/properties.tsx:276-330` — Property and space forms accept empty or whitespace-only names. No duplicate code checking, no minimum length validation.

**Expected**: Client-side validation for required fields with meaningful error messages.

**File**: `src/pages/properties.tsx:276-330`

---

#### BUG-013: Comment submission fails silently

**Observed** (code review): `src/components/comment-composer.tsx:31-32` — Error is only logged to console. No user feedback if comment submission fails.

**Expected**: Show error toast or inline error message when comment fails.

**File**: `src/components/comment-composer.tsx:31-32`

---

#### BUG-014: Settings page has no unsaved-changes warning

**Observed** (code review): `src/pages/settings.tsx:41-59` — Editing settings and navigating away loses changes silently.

**Expected**: Show "You have unsaved changes" warning when navigating away from dirty form.

**File**: `src/pages/settings.tsx:41-59`

---

#### BUG-015: Reports page uses native alert() for errors

**Observed** (code review): `src/pages/reports.tsx:109` — CSV export errors use `alert()` instead of styled error UI.

**Expected**: Use toast notification or inline error message.

**File**: `src/pages/reports.tsx:109`

---

#### BUG-016: Board filters don't persist across navigation

**Observed** (code review): `src/pages/board.tsx:13` — Filter state is local to the component. Navigating away and back resets all filters.

**Expected**: Persist filters in URL query params or localStorage.

**File**: `src/pages/board.tsx:13`

---

#### BUG-017: No error boundary in the app

**Observed** (code review): `src/App.tsx` — No React Error Boundary wrapping routes. Any unhandled component error crashes the entire app to a white screen.

**Expected**: Wrap routes in an Error Boundary that shows a "Something went wrong" fallback with a retry option.

**File**: `src/App.tsx`

---

#### BUG-018: Report form doesn't reset photos after submit

**Observed** (code review): `src/pages/report.tsx:51-77` — After successful submission, the photos array is not cleared. If the user navigates back to the form, stale photos may still be shown.

**File**: `src/pages/report.tsx:51-77`

---

#### BUG-019: Settings form shows changed values even after save failure

**Observed** (code review): `src/pages/settings.tsx:41-59` — Form state synced from query data, but if save fails, the form still displays the changed values, misleading the user.

**File**: `src/pages/settings.tsx:41-59`

---

### P3 — Low

#### BUG-020: Login page relies on browser-native required field validation

**Observed**: No custom validation messages. Different browsers show different native validation popups.

**File**: `src/pages/login.tsx:45-66`

---

#### BUG-021: Claim page signup form has no placeholder text

**Observed**: Login form has placeholders ("you@example.com", dots for password). Claim form has empty inputs with no placeholders.

**File**: `src/pages/claim.tsx`

---

#### BUG-022: Board cards polling every 15s without backoff

**Observed** (code review): `src/hooks/use-board.ts:61` — `refetchInterval: 15_000` fires even when API calls fail. No exponential backoff.

**Expected**: Increase interval or stop polling after repeated failures.

**File**: `src/hooks/use-board.ts:61`

---

#### BUG-023: My Requests uses inconsistent date formatting

**Observed** (code review): `src/pages/my-requests.tsx:81` — Uses `toLocaleDateString()` without explicit locale, producing different formats per browser.

**File**: `src/pages/my-requests.tsx:81`

---

#### BUG-024: Activity timeline has no pagination/virtualization

**Observed** (code review): `src/components/activity-timeline.tsx:30-80` — Renders entire timeline without pagination. Could cause performance issues for requests with many comments.

**File**: `src/components/activity-timeline.tsx:30-80`

---

#### BUG-025: No confirmation dialog for archive actions

**Observed** (code review): `src/pages/properties.tsx:392` — Uses browser-native `confirm()` instead of a styled modal.

**File**: `src/pages/properties.tsx:392`

---

### Accessibility Issues

#### A11Y-001: Board search input missing aria-label
**File**: `src/components/board-filters.tsx:46-52`

#### A11Y-002: Board card overdue indicator not announced to screen readers
**File**: `src/components/board-card.tsx:47,70-71`

#### A11Y-003: Status actions dialog lacks proper ARIA roles and focus trap
**File**: `src/components/status-actions.tsx:126-157`

#### A11Y-004: Settings toggle buttons missing descriptive aria-label
**File**: `src/pages/settings.tsx:267-283`

---

## Summary

| Severity | Count | Key Issues |
|----------|-------|------------|
| P0 — Critical | 5 | Token expiration, no refresh, invite functions missing, board card click broken, RoleRoute race condition |
| P1 — High | 6 | Claim page UX, no 404, no redirect-back-after-login, drag-drop rollback, memory leak |
| P2 — Medium | 10 | Validation gaps, silent errors, hardcoded data, no error boundaries |
| P3 — Low | 6 | Minor polish, performance, date formatting |
| Accessibility | 4 | Missing ARIA labels, focus traps |
| **Total** | **31** | |

### Test Results Summary

| Category | Pass | Fail | Blocked/Deferred |
|----------|------|------|-------------------|
| Authentication | 4 | 2 | 0 |
| Navigation & Routing | 4 | 5 | 1 |
| Invite / Claim | 1 | 1 | 1 |
| Board | 3 | 2 | 1 |
| Request Lifecycle | 2 | 1 | 2 |
| Admin Pages | 5 | 2 | 0 |
| **Total** | **19** | **13** | **5** |

### Top 5 Priorities

1. **Fix board card click navigation (BUG-026)**: The core workflow — clicking a card to view details — is completely broken. Add `activationConstraint: { distance: 5 }` to dnd-kit's PointerSensor to distinguish clicks from drags.

2. **Fix token expiration handling (BUG-001 + BUG-002)**: Add 401 interception to all API helpers that clears the session and redirects to login. Implement token refresh using the stored `refresh_token`.

3. **Fix RoleRoute race condition (BUG-027)**: `RoleRoute` must wait for profile to load before deciding to redirect. Add a loading state check like `ProtectedRoute` does.

4. **Deploy invite functions (BUG-003)**: Upgrade Run402 tier or reduce function count to get `create-invites` and `redeem-invite` deployed. Without these, no new users can be onboarded.

5. **Add error feedback (BUG-005, BUG-013, BUG-017)**: Users see blank screens when things fail. Add Error Boundary, toast notifications for failed operations.
