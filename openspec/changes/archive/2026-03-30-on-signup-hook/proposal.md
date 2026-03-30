## Why

User profiles are only created during bootstrap (first admin) or invite redemption. If a user signs up outside these flows — or when Google OAuth is added — they get an auth account but no profile row, which blocks all app functionality (RLS, role checks, request submission all require a profile). Run402 now supports an `on-signup` lifecycle hook that fires automatically after every new user registration, letting us auto-create a bare profile immediately.

## What Changes

- Add an **`on-signup`** function that auto-creates a `profiles` row with `role_key: 'resident'` (safe default) whenever a new user signs up via any auth method.
- Update `redeem-invite.ts` to **upgrade** the auto-created profile's role instead of creating a new one, since the profile will already exist when the invite is redeemed.
- Add the `on-signup` function to `deploy.ts` and CLAUDE.md.
- The claim page flow continues to work — it just upgrades the resident profile to the invited role instead of inserting.

## Capabilities

### New Capabilities
- `on-signup-auto-profile`: Function that creates a default profile row when a new user signs up, using the Run402 `on-signup` lifecycle hook.

### Modified Capabilities
- `skmeld-functions`: Functions list grows from 9 to 10 with the new `on-signup` function.
- `skmeld-deploy`: Deploy script includes the new function in the bundle.

## Impact

- **Functions**: New `functions/on-signup.ts`. Receives `{ user: { id, email, created_at } }` from the Run402 gateway.
- **Existing function**: `redeem-invite.ts` already handles the "profile exists" case (lines 29-35 update existing profile). No change needed there.
- **Auth flow**: No frontend changes. The `on-signup` hook is server-side and transparent.
- **RLS**: No changes — the auto-created profile has `role_key: 'resident'`, which is already handled by existing RLS policies.
- **Risk**: If the hook fails (fire-and-forget), the user still has no profile. This is the same as today's behavior for bare signups, so it's not a regression.
