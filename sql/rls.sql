-- SkMeld RLS policies
-- Roles: owner_admin (full), staff (operational), resident (scoped to own data)
-- auth.uid() returns UUID; profile user_id columns are TEXT, so cast with ::text
-- auth.role() returns 'authenticated' for logged-in users

-- Helper: get the user's app-level role from profiles
CREATE OR REPLACE FUNCTION get_user_role() RETURNS TEXT AS $$
  SELECT role_key FROM profiles WHERE user_id = auth.uid()::text
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- App settings — owner_admin only for writes, all authenticated can read
-- ============================================================
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS app_settings_read ON app_settings;
CREATE POLICY app_settings_read ON app_settings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS app_settings_write ON app_settings;
CREATE POLICY app_settings_write ON app_settings FOR ALL TO authenticated
  USING (get_user_role() = 'owner_admin')
  WITH CHECK (get_user_role() = 'owner_admin');

-- ============================================================
-- Role definitions — read-only for all
-- ============================================================
ALTER TABLE role_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS role_definitions_read ON role_definitions;
CREATE POLICY role_definitions_read ON role_definitions FOR SELECT TO anon, authenticated USING (true);

-- ============================================================
-- Profiles — user reads/updates self, admin reads/updates all, staff reads all
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profiles_select ON profiles;
CREATE POLICY profiles_select ON profiles FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()::text
    OR get_user_role() IN ('owner_admin', 'staff')
  );
DROP POLICY IF EXISTS profiles_update ON profiles;
CREATE POLICY profiles_update ON profiles FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()::text
    OR get_user_role() = 'owner_admin'
  )
  WITH CHECK (
    user_id = auth.uid()::text
    OR get_user_role() = 'owner_admin'
  );
DROP POLICY IF EXISTS profiles_insert ON profiles;
CREATE POLICY profiles_insert ON profiles FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'owner_admin' OR user_id = auth.uid()::text);

-- ============================================================
-- Invites — owner_admin only
-- ============================================================
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS invites_admin ON invites;
CREATE POLICY invites_admin ON invites FOR ALL TO authenticated
  USING (get_user_role() = 'owner_admin')
  WITH CHECK (get_user_role() = 'owner_admin');
-- Allow reading own invite by token (for claim flow via functions)
DROP POLICY IF EXISTS invites_read_anon ON invites;
CREATE POLICY invites_read_anon ON invites FOR SELECT TO anon USING (true);

-- ============================================================
-- Properties — admin full, staff read, resident read active
-- ============================================================
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS properties_read ON properties;
CREATE POLICY properties_read ON properties FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS properties_read_anon ON properties;
CREATE POLICY properties_read_anon ON properties FOR SELECT TO anon USING (is_active = true);
DROP POLICY IF EXISTS properties_write ON properties;
CREATE POLICY properties_write ON properties FOR ALL TO authenticated
  USING (get_user_role() = 'owner_admin')
  WITH CHECK (get_user_role() = 'owner_admin');

-- ============================================================
-- Space types — read-only for all
-- ============================================================
ALTER TABLE space_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS space_types_read ON space_types;
CREATE POLICY space_types_read ON space_types FOR SELECT TO anon, authenticated USING (true);

-- ============================================================
-- Spaces — admin full, staff read, resident read active
-- ============================================================
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS spaces_read ON spaces;
CREATE POLICY spaces_read ON spaces FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS spaces_read_anon ON spaces;
CREATE POLICY spaces_read_anon ON spaces FOR SELECT TO anon USING (is_active = true);
DROP POLICY IF EXISTS spaces_write ON spaces;
CREATE POLICY spaces_write ON spaces FOR ALL TO authenticated
  USING (get_user_role() = 'owner_admin')
  WITH CHECK (get_user_role() = 'owner_admin');

-- ============================================================
-- Space occupancies — admin full, resident reads own
-- ============================================================
ALTER TABLE space_occupancies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS occupancies_read ON space_occupancies;
CREATE POLICY occupancies_read ON space_occupancies FOR SELECT TO authenticated
  USING (
    profile_user_id = auth.uid()::text
    OR get_user_role() IN ('owner_admin', 'staff')
  );
DROP POLICY IF EXISTS occupancies_write ON space_occupancies;
CREATE POLICY occupancies_write ON space_occupancies FOR ALL TO authenticated
  USING (get_user_role() = 'owner_admin')
  WITH CHECK (get_user_role() = 'owner_admin');

-- ============================================================
-- Workflow config tables — read-only for all authenticated
-- ============================================================
ALTER TABLE request_statuses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS statuses_read ON request_statuses;
CREATE POLICY statuses_read ON request_statuses FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE priority_levels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS priorities_read ON priority_levels;
CREATE POLICY priorities_read ON priority_levels FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE request_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS categories_read ON request_categories;
CREATE POLICY categories_read ON request_categories FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE entry_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS entry_prefs_read ON entry_preferences;
CREATE POLICY entry_prefs_read ON entry_preferences FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE request_sources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sources_read ON request_sources;
CREATE POLICY sources_read ON request_sources FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE status_transitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS transitions_read ON status_transitions;
CREATE POLICY transitions_read ON status_transitions FOR SELECT TO authenticated USING (true);

-- ============================================================
-- Vendors — admin/staff full, resident no access
-- ============================================================
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS vendors_read ON vendors;
CREATE POLICY vendors_read ON vendors FOR SELECT TO authenticated
  USING (get_user_role() IN ('owner_admin', 'staff'));
DROP POLICY IF EXISTS vendors_write ON vendors;
CREATE POLICY vendors_write ON vendors FOR ALL TO authenticated
  USING (get_user_role() IN ('owner_admin', 'staff'))
  WITH CHECK (get_user_role() IN ('owner_admin', 'staff'));

-- ============================================================
-- Maintenance requests — admin/staff see all, resident sees own
-- ============================================================
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS requests_select ON maintenance_requests;
CREATE POLICY requests_select ON maintenance_requests FOR SELECT TO authenticated
  USING (
    get_user_role() IN ('owner_admin', 'staff')
    OR requester_profile_user_id = auth.uid()::text
  );
-- Writes go through functions (service_role), not direct PostgREST

-- ============================================================
-- Request comments — admin/staff see all, resident sees public on own requests
-- ============================================================
ALTER TABLE request_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS comments_select ON request_comments;
CREATE POLICY comments_select ON request_comments FOR SELECT TO authenticated
  USING (
    get_user_role() IN ('owner_admin', 'staff')
    OR (
      visibility = 'public'
      AND request_id IN (
        SELECT id FROM maintenance_requests WHERE requester_profile_user_id = auth.uid()::text
      )
    )
  );

-- ============================================================
-- Attachments — same as comments
-- ============================================================
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS attachments_select ON attachments;
CREATE POLICY attachments_select ON attachments FOR SELECT TO authenticated
  USING (
    get_user_role() IN ('owner_admin', 'staff')
    OR (
      visibility = 'public'
      AND request_id IN (
        SELECT id FROM maintenance_requests WHERE requester_profile_user_id = auth.uid()::text
      )
    )
  );

-- ============================================================
-- Request events — admin/staff see all, resident sees public on own requests
-- ============================================================
ALTER TABLE request_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS events_select ON request_events;
CREATE POLICY events_select ON request_events FOR SELECT TO authenticated
  USING (
    get_user_role() IN ('owner_admin', 'staff')
    OR (
      visibility = 'public'
      AND request_id IN (
        SELECT id FROM maintenance_requests WHERE requester_profile_user_id = auth.uid()::text
      )
    )
  );

-- ============================================================
-- Notification log — admin/staff only
-- ============================================================
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notifications_read ON notification_log;
CREATE POLICY notifications_read ON notification_log FOR SELECT TO authenticated
  USING (get_user_role() IN ('owner_admin', 'staff'));
