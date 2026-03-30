## Context

SkMeld is invite-only. Profiles are created in two places: `bootstrap.ts` (first admin) and `redeem-invite.ts` (invited users). Both follow the pattern: sign up via auth API, then insert a profile row with the appropriate role.

If a user manages to sign up without an invite (e.g., direct API call, or future Google OAuth), they get an auth account but no profile. Every protected endpoint checks for a profile and returns 403 without one.

Run402 now supports an `on-signup` lifecycle hook (commit `a96bf27`). Deploy a function named exactly `on-signup`, and the gateway auto-invokes it after every new user signup with `{ user: { id, email, created_at } }` via POST. It's fire-and-forget — errors don't block the signup response.

## Goals / Non-Goals

**Goals:**
- Every new user gets a profile row immediately on signup, regardless of how they signed up
- Safe default role (`resident`) that grants minimal access
- Transparent — no frontend changes, no auth flow changes

**Non-Goals:**
- Changing the invite flow — invites still upgrade the auto-created profile's role
- Role assignment in the hook — the hook creates a bare `resident` profile; role upgrades happen via invites or admin action
- Handling the hook failing — it's fire-and-forget by design; if it fails, the user is in the same state as today (no profile)

## Decisions

### 1. Default role is `resident`

**Decision**: Auto-created profiles get `role_key: 'resident'`.

**Why**: It's the most restrictive role. Residents can only see their own requests. If someone signs up without an invite, they should have minimal access until an admin assigns them a proper role. Using `staff` or `owner_admin` would be a security risk.

**Alternative**: No default role / leave profile-less until invite. Rejected because it breaks the app for any non-invite signup path (including future Google OAuth).

### 2. Use `INSERT ... ON CONFLICT DO NOTHING`

**Decision**: The `on-signup` function uses `INSERT INTO profiles ... ON CONFLICT (user_id) DO NOTHING`.

**Why**: `redeem-invite.ts` and `bootstrap.ts` may have already created a profile by the time the hook fires (race condition). `ON CONFLICT DO NOTHING` makes the hook idempotent — if a profile already exists, it silently skips.

**Alternative**: Check-then-insert with `db.from("profiles").select().eq("user_id", id)` first. Works but is two queries and still has a race window. The SQL approach is atomic.

### 3. Use `db.sql()` instead of `db.from()`

**Decision**: Use `db.sql('INSERT INTO profiles ... ON CONFLICT DO NOTHING', [id, email])` for the atomic upsert.

**Why**: `db.from("profiles").insert()` doesn't support `ON CONFLICT` clauses. The parameterized `db.sql()` (available since layer v6) handles this cleanly.

### 4. No changes to `redeem-invite.ts`

**Decision**: Don't modify the invite flow.

**Why**: `redeem-invite.ts` already handles both cases (lines 29-43): if a profile exists, it updates the role; if not, it inserts. The `on-signup` hook creates a bare profile, and `redeem-invite` upgrades it to the invited role. The existing code works as-is.

## Risks / Trade-offs

- **[Fire-and-forget]** If the hook fails, the user has no profile. → Mitigation: Same as today's behavior. The `claim` page still works because `redeem-invite.ts` inserts if no profile exists.
- **[Race condition]** Hook and invite redemption may run concurrently. → Mitigation: `ON CONFLICT DO NOTHING` makes the insert idempotent. `redeem-invite.ts` handles both cases.
- **[Resident role leakage]** A user who signs up without an invite gets `resident` access and can submit maintenance requests. → Mitigation: This is intentional — residents have the most restricted access. Admins can deactivate unwanted accounts.
