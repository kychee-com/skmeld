---
name: "Deploy"
description: "Commit, push, deploy to Run402, test, and report any friction as GitHub issues"
category: Workflow
tags: [deploy, run402, test]
---

Full deploy pipeline: commit, push, deploy to Run402, integration test, and friction reporting.

**Input**: The argument after `/deploy` is optional. Could be:
- Nothing (full pipeline)
- `--skip-commit` (deploy without committing — assumes already committed)
- A commit message override

---

## Step 1: Commit & Push

If there are uncommitted changes:

1. Run `git status` and `git diff --stat` to see what changed
2. Run `git log --oneline -3` for commit message style
3. Stage relevant files (NOT `.env`, credentials, or `node_modules`)
4. Commit with a descriptive message. End with:
   ```
   Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
   ```
5. `git push`

If the working tree is clean, skip to Step 2.

---

## Step 2: Type-check

```bash
npx tsc -b --noEmit
```

If it fails, fix the errors before deploying. Do NOT deploy broken code.

---

## Step 3: Deploy

```bash
npm run deploy
```

Parse the output and report:
- **Tier subscription**: status code
- **Project**: ID (new or reused)
- **Bundle deploy**: status (200 = success, 4xx/5xx = show error)
- **Bootstrap**: result or error
- **Scheduled function**: deployed or skipped (tier limit)
- **URL**: the deployed subdomain

If the bundle deploy fails, investigate the error before continuing.

---

## Step 4: Integration Tests

Run these API tests against the deployed instance using the anon key and credentials from the deploy output:

1. **Admin login** — `POST /auth/v1/token` with bootstrap admin credentials
2. **Board cards** — `GET /rest/v1/v_request_board?limit=3` with admin token
3. **New user signup** — `POST /auth/v1/signup` with a test email
4. **On-signup hook** — Login as new user, check `GET /rest/v1/profiles` for auto-created profile
5. **Google OAuth providers** — `GET /auth/v1/providers` to verify Google is enabled
6. **Google OAuth start** — `POST /auth/v1/oauth/google/start` with a test PKCE challenge to verify the endpoint returns an `authorization_url`
7. **Site loads** — `curl` the subdomain URL, check for 200 and correct `<title>`

Report results as a table: test name, pass/fail, details.

---

## Step 5: Friction Report

Compare the deploy and test results against expected behavior. Look for:
- **Errors**: Any 4xx/5xx that shouldn't happen
- **Regressions**: Tests that passed before but fail now
- **DX issues**: Confusing error messages, missing docs, unexpected limits
- **New friction**: Anything that required a workaround

For each issue found:
1. Check if it's already filed on the run402 repo: `gh issue list --repo MajorTal/run402 --state open`
2. If not already filed, create a GitHub issue:
   ```bash
   gh issue create --repo MajorTal/run402 --title "..." --body "..."
   ```
   Include: problem description, reproduction steps, expected vs actual, suggestion.

If no new friction is found, say so — don't file issues for the sake of filing.

---

## Step 6: Summary

Present a final summary:

```
## Deploy Complete

**Commit**: <hash> <message>
**URL**: https://<subdomain>.run402.com
**Bundle**: <status>
**Tests**: <N/N> passed

### Test Results
| Test | Result |
|------|--------|
| ... | ... |

### Issues Filed
- MajorTal/run402#<N>: <title> (or "None — clean deploy")
```

---

## Guardrails

- **Never deploy with type errors** — fix first
- **Never commit `.env` or credentials** — check `.gitignore`
- **Don't file duplicate issues** — search open issues first
- **Parse deploy output carefully** — extract anon key, service key, admin password from the bootstrap result
- **Test against the DEPLOYED instance** — use the actual API URL and keys from the deploy output, not hardcoded values
- **If deploy fails, diagnose before retrying** — read the error, don't blindly retry
