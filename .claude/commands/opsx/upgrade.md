---
name: "OPSX: Upgrade"
description: "Check upstream Run402 for new features, compare against last sync, explore what to adopt"
category: Workflow
tags: [workflow, explore, upgrade, run402, integration]
---

Check the upstream Run402 platform repo for changes since the last integration sync, analyze impact on this project, and enter explore mode to decide what to adopt.

**This skill combines automated diffing with the explore stance.** First it gathers facts, then it becomes a thinking partner.

**Input**: The argument after `/opsx:upgrade` is optional. Could be:
- Nothing (full upstream diff analysis)
- A focus area: "email", "auth", "deploy", "functions"
- A specific run402 commit range: "abc123..def456"

---

## Phase 1: Gather

Run these steps automatically before engaging the user.

### 1. Read the last sync point

Check `CLAUDE.md` for the "Run402 Integration Log" section. Find:
- The **last sync date**
- The **run402 baseline commit** (the last run402 commit that was adopted)

If no integration log exists, note that this is the first sync and use the earliest skmeld commit as baseline.

Also check memory for the `Run402 Integration Sync Point` entry — it records the exact commit pair.

### 2. Diff the upstream repo

```bash
# Get all commits since the last sync baseline
cd /Users/talweiss/Developer/run402
git log --oneline <baseline_commit>..HEAD
```

If the baseline commit is not found (repo was rebased, etc.), fall back to `git log --oneline --since="<last_sync_date>"`.

### 3. Categorize changes by impact

Read commit messages and changed files. Categorize into:

| Category | What to look for |
|----------|-----------------|
| **Functions runtime** | Changes to `@run402/functions` exports, Lambda layer bumps, new helpers |
| **API surface** | New/changed endpoints in `llms.txt`, `openapi.json` |
| **Deploy** | Changes to bundle deploy, new deploy flags, manifest format |
| **Auth** | JWT changes, new auth methods, CORS changes |
| **Email** | New email features, template changes, rate limits |
| **Infrastructure** | CDN, subdomains, storage, DNS |
| **CLI** | New CLI commands or flags in `llms-cli.txt` |
| **Breaking** | Anything that could break existing integrations |

### 4. Cross-reference with current codebase

For each relevant change, check if skmeld already uses the affected area:
- Read `deploy.ts` for deploy-related changes
- Read `functions/*.ts` for runtime changes
- Read `src/api/client.ts` and `src/lib/auth.tsx` for auth/API changes
- Read `CLAUDE.md` "Not-yet-adopted" list for already-known gaps

---

## Phase 2: Explore

Present findings and enter **explore mode** (same stance as `/opsx:explore`).

### Present the diff summary

```
## Run402 Upstream Changes

Since last sync (<date>, run402 commit <hash>):
<N> commits, categorized:

### Directly relevant (affects skmeld integration points)
- ...

### Available but not yet used
- ...

### Infrastructure / no action needed
- ...
```

Use ASCII diagrams to visualize architectural changes when helpful.

### Explore with the user

Now behave exactly like `/opsx:explore`:
- **Curious, not prescriptive** — surface options, don't push adoption
- **Grounded** — reference actual code in both repos
- **Visual** — diagram integration points, before/after comparisons
- **Patient** — let the user decide what's worth adopting

When the user decides to adopt something, offer:
- "Want me to create a change proposal for this? (`/opsx:propose`)"
- "This is a small fix, I can just apply it directly if you want"
- "Let me update the integration log in CLAUDE.md"

### Track decisions

As the user makes decisions, offer to update:

| Decision | Where to capture |
|----------|-----------------|
| Feature adopted | Apply code change + update CLAUDE.md integration log |
| Feature deferred | Add to "Not-yet-adopted" in CLAUDE.md |
| Feature irrelevant | No action needed |
| Needs investigation | Suggest a spike or `/opsx:explore` session |

---

## Phase 3: Update sync point

When the exploration wraps up (user is done reviewing), offer to update the integration log:

1. Update `CLAUDE.md` — bump the "Last sync" date and baseline commit, move adopted items from "not-yet-adopted" to the applied list, add new not-yet-adopted items
2. Update memory — update the `Run402 Integration Sync Point` memory entry with the new commit pair

---

## Guardrails

- **Don't auto-adopt** — Present changes, let the user decide
- **Don't implement in explore mode** — If adoption requires code changes, either do small fixes inline (with user approval) or suggest `/opsx:propose` for larger work
- **Don't skip the diff** — Always start with actual git data, don't rely solely on memory
- **Do read both repos** — Ground recommendations in the actual code on both sides
- **Do highlight breaking changes** — If something in run402 could break the current deploy, flag it prominently
- **Do update the sync point** — Keep the integration log and memory current so the next `/upgrade` run starts from the right baseline
