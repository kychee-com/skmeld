## Why

The deploy script was creating a new Run402 project on every run. We fixed project persistence (`app.json`), but the SQL migrations still use bare `CREATE TABLE` / `CREATE INDEX` / `CREATE POLICY` which will error on redeploy to the same project. The Run402 docs explicitly recommend `CREATE TABLE IF NOT EXISTS` with `ALTER TABLE ADD COLUMN` wrappers for evolving schemas. Without this, every deploy after the first fails with "relation already exists".

## What Changes

- Convert all `CREATE TABLE` statements in `schema.sql` to `CREATE TABLE IF NOT EXISTS`
- Wrap new columns (like `is_overdue_notified`) in `DO $$ BEGIN ALTER TABLE ... ADD COLUMN ... EXCEPTION WHEN duplicate_column THEN NULL; END $$` blocks
- Convert all `CREATE INDEX` to `CREATE INDEX IF NOT EXISTS`
- Convert RLS policies in `rls.sql` to use `DROP POLICY IF EXISTS` + `CREATE POLICY` pattern (policies don't have `IF NOT EXISTS`)
- Convert views in `views.sql` to `CREATE OR REPLACE VIEW`
- Convert `INSERT` seed data in `seed-base.sql` to use `ON CONFLICT DO NOTHING`
- Test by deploying twice to the same project

## Capabilities

### Modified Capabilities
- `skmeld-schema`: All DDL becomes idempotent for safe redeploy
- `skmeld-deploy`: Deploy script now reuses project from app.json (already committed, needs testing)

## Impact

- **SQL files**: `schema.sql`, `seed-base.sql`, `rls.sql`, `views.sql` — all modified
- **No data loss**: All changes are additive. `IF NOT EXISTS` / `ON CONFLICT` are safe on existing data.
- **No frontend changes**
- **No function changes**
