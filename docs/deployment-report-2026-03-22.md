# SkMeld Deployment Report — 2026-03-22

## Summary

Deployed SkMeld to https://skmeld.run402.com using the `run402` CLI (step-by-step, not bundle deploy). Bundle deploy (`run402 deploy --manifest app.json`) failed with a 500 error. Root cause identified and documented below.

## What Deployed Successfully

| Step | Command | Result |
|------|---------|--------|
| Provision | `run402 projects provision --name skmeld` | `prj_1774197184820_0031` |
| SQL migrations | `run402 projects sql <id> --file deploy-migrations.sql` | All tables, RLS, views created |
| Function: bootstrap | `run402 functions deploy <id> bootstrap --code functions/bootstrap.ts` | Deployed |
| Function: submit-request | `run402 functions deploy <id> submit-request --code functions/submit-request.ts` | Deployed |
| Function: update-request | `run402 functions deploy <id> update-request --code functions/update-request.ts` | Deployed |
| Function: transition-request | `run402 functions deploy <id> transition-request --code functions/transition-request.ts` | Deployed |
| Function: add-comment | `run402 functions deploy <id> add-comment --code functions/add-comment.ts` | Deployed |
| Site deploy | `run402 sites deploy --manifest site-manifest.json` | `dpl_1774197693114_88822c` |
| Subdomain | `run402 subdomains claim skmeld` | https://skmeld.run402.com |
| Bootstrap invoke | Manual (function invoke returned 500) | Admin created, demo data seeded |

## What Failed

### 1. Bundle deploy — 500 Internal Server Error

**Command**: `run402 deploy --manifest app.json`

**Root cause**: `operator does not exist: text = uuid`

SkMeld defines `profiles.user_id` as `TEXT`. Run402's `auth.uid()` returns `UUID`. When the bundle deploy runs the RLS SQL containing `WHERE user_id = auth.uid()`, Postgres rejects the implicit TEXT = UUID comparison.

**Bugsnag errors** (found at ~2026-03-22T16:34:49Z):
- `Migration SQL error: operator does not exist: text = uuid` (bundle.js:216)
- `operator does not exist: uuid = text` (pg/lib/client.js:631, 9 occurrences)

**SkMeld fix applied**: Added `::text` cast to all `auth.uid()` calls in `sql/rls.sql`.

**Run402 fix needed**: In `packages/gateway/src/services/bundle.ts:304`, migration SQL errors throw a plain `Error` instead of `BundleError(msg, 400)`. This causes the gateway to return a generic `{"error":"Internal server error"}` 500 instead of a useful `{"error":"Migration SQL error: operator does not exist: text = uuid"}` 400. The admin route (`routes/admin.ts:238`) already handles this correctly with `new HttpError(400, ...)`.

### 2. Function limit — 403

**Command**: `run402 functions deploy <id> create-invites --code functions/create-invites.ts`

**Error**: `Function limit reached (5 for your tier). Delete a function first.`

The prototype tier limits projects to 5 functions. SkMeld has 7 functions. The 2 invite functions (`create-invites`, `redeem-invite`) could not be deployed.

**Recommendation**: Consider raising the prototype tier function limit to 10 (or unlimited). 5 is tight for any real app — SkMeld is a simple CRUD app and needs 7.

### 3. Project pin — 500 Internal Server Error

**Command**: `run402 projects pin prj_1774197184820_0031`

**Error**: `{"status":"error","http":500,"error":"Internal server error"}`

Consistent 500 on every attempt. Server-side bug — needs investigation in Run402 gateway logs.

### 4. Bootstrap function invoke — 500

**Command**: `run402 functions invoke <id> bootstrap --body '{"admin_email":"admin@skmeld.example",...}'`

The bootstrap function returned a 500. Likely related to the RLS type mismatch (the function creates a profile row, and any subsequent RLS-evaluated query would hit the same TEXT vs UUID error). After fixing RLS and re-running migrations manually, bootstrap data was seeded via direct SQL.

## Agent Experience Observations

These are friction points encountered while deploying SkMeld as a coding agent:

### What worked well
- `run402 init` — simple, one-command setup
- `run402 projects provision` — instant, returns keys immediately
- `run402 projects sql --file` — handles large SQL files cleanly
- `run402 functions deploy --code` — straightforward per-function deploy
- `run402 subdomains claim` — simple, works on first try
- Step-by-step deploy worked as a fallback when bundle deploy failed

### Friction points

1. **Bundle deploy 500 with no error details**: The generic "Internal server error" message gave no indication of what went wrong. An agent (or human) has no way to debug this without access to server logs. The SQL error message should be returned to the client.

2. **No `--file` flag on `run402 functions deploy`**: The docs say `--file` but the actual flag is `--code`. Minor but causes a wasted round-trip.

3. **Site manifest creation is tedious**: There's no `run402 sites deploy --dir site/` command. The agent must manually read every file in the build output, construct a JSON manifest with inline file contents, and write it to disk. For a Vite build with large JS bundles, this is a ~500KB JSON file. A `--dir` flag that reads files from a directory would eliminate this entirely.

4. **`auth.uid()` returns UUID, but user IDs in auth responses are strings**: The signup endpoint returns `{ id: "uuid-string" }`, which apps naturally store as TEXT. But `auth.uid()` returns UUID type. This type mismatch is a trap — every app that stores user IDs as TEXT (which is natural given the auth API returns strings) will hit this in RLS policies. Options:
   - Document the required `::text` cast prominently
   - Change `auth.uid()` to return TEXT
   - Auto-cast in the `auth.uid()` function

5. **5-function limit is too low for prototype tier**: A minimal real app needs 5-10 functions. SkMeld is a straightforward CRUD app and needs 7. The limit blocks deploying a complete app on the free tier, which undermines the "try it for free" value prop.

6. **No `run402 deploy --dir` for common Vite/React/Next builds**: The most common agent workflow is: build frontend → deploy. A command like `run402 deploy --dir site/ --sql sql/ --functions functions/` would cover 90% of use cases without needing a manifest.

7. **`projects pin` returns 500**: Untested or broken endpoint.

8. **The existing `deploy.ts` script is fragile**: It hardcodes `config({ path: "../../.env" })` assuming a monorepo layout, requires manual BUYER_PRIVATE_KEY management, and uses x402/SIWx libraries directly. The CLI makes all of this unnecessary — the README should point agents to the CLI, not the deploy script.
