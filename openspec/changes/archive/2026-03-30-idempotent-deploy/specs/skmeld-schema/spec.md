## MODIFIED Requirements

### Requirement: Schema DDL is idempotent
All SQL DDL statements SHALL be safe to run repeatedly against the same database without errors.

#### Scenario: Redeploy with no schema changes
- **WHEN** the same migrations SQL is run against an existing database
- **THEN** all statements SHALL succeed without "already exists" errors

#### Scenario: Redeploy with new column added
- **WHEN** a new column is added to schema.sql via `ALTER TABLE ADD COLUMN` in a DO block
- **THEN** the first deploy SHALL add the column and subsequent deploys SHALL skip it silently

#### Scenario: Redeploy with seed data
- **WHEN** seed-base.sql INSERT statements run against a database that already has the seed data
- **THEN** existing rows SHALL not be duplicated (ON CONFLICT DO NOTHING)

#### Scenario: Redeploy with RLS policies
- **WHEN** rls.sql runs against a database with existing policies
- **THEN** policies SHALL be dropped and recreated without errors

#### Scenario: Redeploy with views
- **WHEN** views.sql runs against a database with existing views
- **THEN** views SHALL be replaced with the latest definitions
