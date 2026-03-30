## Context

Run402's bundle deploy runs the `migrations` SQL on every deploy. The SQL must be idempotent — if a table/index/policy already exists, the statement should succeed silently. The Run402 docs show the recommended patterns.

Currently: 20 `CREATE TABLE`, 11 `CREATE INDEX`, ~20 `CREATE POLICY`, 4 `CREATE VIEW`, and seed `INSERT` statements — all non-idempotent.

## Goals / Non-Goals

**Goals:**
- Every SQL file can be run repeatedly against the same schema without errors
- New columns added in future changes are handled via `ALTER TABLE ADD COLUMN` with duplicate_column exception handling
- Deploy to the same project works on second run

**Non-Goals:**
- Column renames or type changes (would need more complex migration logic)
- Dropping tables or columns (destructive, not needed)
- Migration versioning system (overkill for this stage)

## Decisions

### 1. `CREATE TABLE IF NOT EXISTS` for all tables

**Decision**: Simple find-and-replace. All tables use this pattern.

**Why**: Postgres natively supports it. No extra wrapping needed.

### 2. `DO $$ ... ALTER TABLE ADD COLUMN ... EXCEPTION WHEN duplicate_column` for new columns

**Decision**: Wrap the `is_overdue_notified` column (added after initial schema) in a DO block.

**Why**: `IF NOT EXISTS` on `CREATE TABLE` only prevents the table error — it doesn't add missing columns. Any column added after the initial release needs the ALTER wrapper per Run402 docs.

### 3. `DROP POLICY IF EXISTS` + `CREATE POLICY` for RLS

**Decision**: Precede each `CREATE POLICY` with `DROP POLICY IF EXISTS ... ON ...`.

**Why**: Postgres `CREATE POLICY` doesn't have an `IF NOT EXISTS` variant. Dropping and recreating is the idempotent pattern. This also means policy changes are applied on redeploy.

### 4. `CREATE OR REPLACE VIEW` for views

**Decision**: Replace `CREATE VIEW` with `CREATE OR REPLACE VIEW`.

**Why**: Natively supported, updates the view definition on redeploy.

### 5. `ON CONFLICT DO NOTHING` for seed data

**Decision**: Add `ON CONFLICT DO NOTHING` to all `INSERT` statements in `seed-base.sql`.

**Why**: Seed data should only be inserted once. If it already exists, skip silently.

## Risks / Trade-offs

- **[Policy recreation]** Dropping and recreating policies is atomic within a transaction but briefly removes access. → Mitigation: Bundle deploy runs migrations in a single transaction.
- **[Seed data updates]** `ON CONFLICT DO NOTHING` means seed data changes won't be applied on redeploy. → Mitigation: Acceptable — seed data is defaults, not configuration. Use `ON CONFLICT DO UPDATE` if specific values need updating.
