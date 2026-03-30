## Why

SkMeld currently only supports email/password login. Google OAuth is zero-config on Run402 — it's already enabled for all projects with no setup needed. Adding a "Sign in with Google" button lowers the barrier for new users (no password to remember), is the expected login experience for most SaaS apps, and works seamlessly with the `on-signup` lifecycle hook that auto-creates resident profiles.

## What Changes

- Add a **"Sign in with Google" button** on the login page with PKCE-based OAuth flow
- Add an **OAuth callback handler** on the login page that exchanges the auth code for tokens on page load
- Add **PKCE helper utilities** (verifier generation, SHA-256 challenge) to the auth module
- Update the **auth context** to support the Google OAuth token exchange alongside password login
- Handle the **"account exists" edge case** when a Google email matches an existing password account

## Capabilities

### New Capabilities
- `google-oauth-login`: Frontend Google OAuth flow — PKCE generation, redirect to Google, callback handling, token exchange.

### Modified Capabilities
- `auth-token-refresh`: Auth context needs to handle the OAuth callback and store the session the same way as password login.

## Impact

- **Frontend only**: `src/pages/login.tsx` (button + callback), `src/lib/auth.tsx` (PKCE helpers + OAuth login method). No backend changes — Run402 handles everything server-side.
- **No new dependencies**: Uses browser `crypto.subtle` for PKCE.
- **Allowed origins**: `http://localhost:*` and `https://{subdomain}.run402.com` are auto-allowed by Run402. No manual config needed.
- **on-signup hook**: Google users auto-get a resident profile via the existing `on-signup` function. Google provides `display_name` and `avatar_url` which are available via `GET /auth/v1/user`.
