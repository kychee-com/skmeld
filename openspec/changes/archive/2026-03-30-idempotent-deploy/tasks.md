## 1. Schema (schema.sql)

- [x] 1.1 Convert all `CREATE TABLE` to `CREATE TABLE IF NOT EXISTS`
- [x] 1.2 Convert all `CREATE INDEX` to `CREATE INDEX IF NOT EXISTS`
- [x] 1.3 Wrap the `is_overdue_notified` column in a `DO $$ BEGIN ALTER TABLE ... ADD COLUMN ... EXCEPTION WHEN duplicate_column THEN NULL; END $$` block after the CREATE TABLE

## 2. Seed Data (seed-base.sql)

- [x] 2.1 Add `ON CONFLICT DO NOTHING` to all INSERT statements (already present)

## 3. RLS (rls.sql)

- [x] 3.1 Add `DROP POLICY IF EXISTS <name> ON <table>;` before each `CREATE POLICY` statement (30 policies)
- [x] 3.2 Ensure `CREATE OR REPLACE FUNCTION` is used for `get_user_role()` (already present)

## 4. Views (views.sql)

- [x] 4.1 Convert all `CREATE VIEW` to `CREATE OR REPLACE VIEW` (already present)

## 5. Test

- [x] 5.1 Deploy twice to the same project (using app.json persistence) and verify second deploy succeeds
