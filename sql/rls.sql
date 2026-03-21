-- SkMeld RLS policies
-- Roles: owner_admin (full), staff (operational), resident (scoped to own data)
-- auth.uid() returns the authenticated user's id from JWT sub claim
-- auth.role() returns 'authenticated' for logged-in users

-- Helper: get the user's app-level role from profiles
CREATE OR REPLACE FUNCTION get_user_role() RETURNS TEXT AS $$
  SELECT role_key FROM profiles WHERE user_id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- App settings — owner_admin only for writes, all authenticated can read
-- ============================================================
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY app_settings_read ON app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY app_settings_write ON app_settings FOR ALL TO authenticated
  USING (get_user_role() = 'owner_admin')
  WITH CHECK (get_user_role() = 'owner_admin');

-- ============================================================
-- Role definitions — read-only for all
-- ============================================================
ALTER TABLE role_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY role_definitions_read ON role_definitions FOR SELECT TO anon, authenticated USING (true);

-- ============================================================
-- Profiles — user reads/updates self, admin reads/updates all, staff reads all
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_select ON profiles FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR get_user_role() IN ('owner_admin', 'staff')
  );
CREATE POLICY profiles_update ON profiles FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR get_user_role() = 'owner_admin'
  )
  WITH CHECK (
    user_id = auth.uid()
    OR get_user_role() = 'owner_admin'
  );
CREATE POLICY profiles_insert ON profiles FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'owner_admin' OR user_id = auth.uid());

-- ============================================================
-- Invites — owner_admin only
-- ============================================================
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY invites_admin ON invites FOR ALL TO authenticated
  USING (get_user_role() = 'owner_admin')
  WITH CHECK (get_user_role() = 'owner_admin');
-- Allow reading own invite by token (for claim flow via functions)
CREATE POLICY invites_read_anon ON invites FOR SELECT TO anon USING (true);

-- ============================================================
-- Properties — admin full, staff read, resident read active
-- ============================================================
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY properties_read ON properties FOR SELECT TO authenticated USING (true);
CREATE POLICY properties_read_anon ON properties FOR SELECT TO anon USING (is_active = true);
CREATE POLICY properties_write ON properties FOR ALL TO authenticated
  USING (get_user_role() = 'owner_admin')
  WITH CHECK (get_user_role() = 'owner_admin');

-- ============================================================
-- Space types — read-only for all
-- ============================================================
ALTER TABLE space_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY space_types_read ON space_types FOR SELECT TO anon, authenticated USING (true);

-- ============================================================
-- Spaces — admin full, staff read, resident read active
-- ============================================================
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY spaces_read ON spaces FOR SELECT TO authenticated USING (true);
CREATE POLICY spaces_read_anon ON spaces FOR SELECT TO anon USING (is_active = true);
CREATE POLICY spaces_write ON spaces FOR ALL TO authenticated
  USING (get_user_role() = 'owner_admin')
  WITH CHECK (get_user_role() = 'owner_admin');

-- ============================================================
-- Space occupancies — admin full, resident reads own
-- ============================================================
ALTER TABLE space_occupancies ENABLE ROW LEVEL SECURITY;
CREATE POLICY occupancies_read ON space_occupancies FOR SELECT TO authenticated
  USING (
    profile_user_id = auth.uid()
    OR get_user_role() IN ('owner_admin', 'staff')
  );
CREATE POLICY occupancies_write ON space_occupancies FOR ALL TO authenticated
  USING (get_user_role() = 'owner_admin')
  WITH CHECK (get_user_role() = 'owner_admin');

-- ============================================================
-- Workflow config tables — read-only for all authenticated
-- ============================================================
ALTER TABLE request_statuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY statuses_read ON request_statuses FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE priority_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY priorities_read ON priority_levels FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE request_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY categories_read ON request_categories FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE entry_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY entry_prefs_read ON entry_preferences FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE request_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY sources_read ON request_sources FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE status_transitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY transitions_read ON status_transitions FOR SELECT TO authenticated USING (true);

-- ============================================================
-- Vendors — admin/staff full, resident no access
-- ============================================================
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY vendors_read ON vendors FOR SELECT TO authenticated
  USING (get_user_role() IN ('owner_admin', 'staff'));
CREATE POLICY vendors_write ON vendors FOR ALL TO authenticated
  USING (get_user_role() IN ('owner_admin', 'staff'))
  WITH CHECK (get_user_role() IN ('owner_admin', 'staff'));

-- ============================================================
-- Maintenance requests — admin/staff see all, resident sees own
-- ============================================================
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY requests_select ON maintenance_requests FOR SELECT TO authenticated
  USING (
    get_user_role() IN ('owner_admin', 'staff')
    OR requester_profile_user_id = auth.uid()
  );
-- Writes go through functions (service_role), not direct PostgREST

-- ============================================================
-- Request comments — admin/staff see all, resident sees public on own requests
-- ============================================================
ALTER TABLE request_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY comments_select ON request_comments FOR SELECT TO authenticated
  USING (
    get_user_role() IN ('owner_admin', 'staff')
    OR (
      visibility = 'public'
      AND request_id IN (
        SELECT id FROM maintenance_requests WHERE requester_profile_user_id = auth.uid()
      )
    )
  );

-- ============================================================
-- Attachments — same as comments
-- ============================================================
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY attachments_select ON attachments FOR SELECT TO authenticated
  USING (
    get_user_role() IN ('owner_admin', 'staff')
    OR (
      visibility = 'public'
      AND request_id IN (
        SELECT id FROM maintenance_requests WHERE requester_profile_user_id = auth.uid()
      )
    )
  );

-- ============================================================
-- Request events — admin/staff see all, resident sees public on own requests
-- ============================================================
ALTER TABLE request_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY events_select ON request_events FOR SELECT TO authenticated
  USING (
    get_user_role() IN ('owner_admin', 'staff')
    OR (
      visibility = 'public'
      AND request_id IN (
        SELECT id FROM maintenance_requests WHERE requester_profile_user_id = auth.uid()
      )
    )
  );

-- ============================================================
-- Notification log — admin/staff only
-- ============================================================
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_read ON notification_log FOR SELECT TO authenticated
  USING (get_user_role() IN ('owner_admin', 'staff'));
