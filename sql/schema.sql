-- SkMeld schema — Property Maintenance Request Tracker
-- All tables use snake_case. No enums — config is data-driven.

-- ============================================================
-- A. App settings (single-row config)
-- ============================================================

CREATE TABLE app_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  app_name TEXT NOT NULL DEFAULT 'SkMeld',
  company_name TEXT,
  logo_url TEXT,
  theme_key TEXT NOT NULL DEFAULT 'emerald',
  support_email TEXT,
  support_phone TEXT,
  emergency_instructions TEXT,
  time_zone TEXT NOT NULL DEFAULT 'America/New_York',
  allow_requester_priority_selection BOOLEAN NOT NULL DEFAULT false,
  show_pets_field BOOLEAN NOT NULL DEFAULT true,
  show_preferred_visit_window BOOLEAN NOT NULL DEFAULT true,
  show_entry_preference BOOLEAN NOT NULL DEFAULT true,
  ui_labels JSONB NOT NULL DEFAULT '{
    "requester_singular": "Resident",
    "requester_plural": "Residents",
    "property_singular": "Property",
    "property_plural": "Properties",
    "space_singular": "Unit",
    "space_plural": "Units",
    "request_singular": "Request",
    "request_plural": "Requests"
  }'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- B. People / auth
-- ============================================================

CREATE TABLE role_definitions (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE profiles (
  user_id TEXT PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  role_key TEXT NOT NULL REFERENCES role_definitions(key),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE invites (
  id TEXT PRIMARY KEY DEFAULT 'inv_' || substr(gen_random_uuid()::text, 1, 12),
  email TEXT,
  full_name TEXT,
  role_key TEXT NOT NULL REFERENCES role_definitions(key),
  token TEXT NOT NULL UNIQUE DEFAULT substr(gen_random_uuid()::text, 1, 20),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '7 days',
  accepted_at TIMESTAMPTZ,
  invited_by_user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'
);

-- ============================================================
-- C. Property structure
-- ============================================================

CREATE TABLE properties (
  id TEXT PRIMARY KEY DEFAULT 'prop_' || substr(gen_random_uuid()::text, 1, 12),
  name TEXT NOT NULL,
  code TEXT,
  street_1 TEXT,
  street_2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'US',
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE space_types (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE spaces (
  id TEXT PRIMARY KEY DEFAULT 'spc_' || substr(gen_random_uuid()::text, 1, 12),
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  space_type_key TEXT REFERENCES space_types(key),
  floor TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_spaces_property ON spaces(property_id);

CREATE TABLE space_occupancies (
  id TEXT PRIMARY KEY DEFAULT 'occ_' || substr(gen_random_uuid()::text, 1, 12),
  profile_user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  start_date DATE,
  end_date DATE,
  is_primary BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_occupancies_user ON space_occupancies(profile_user_id);
CREATE INDEX idx_occupancies_space ON space_occupancies(space_id);

-- ============================================================
-- D. Workflow config (data-driven, no enums)
-- ============================================================

CREATE TABLE request_statuses (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  color_token TEXT NOT NULL DEFAULT 'gray',
  board_order INTEGER NOT NULL DEFAULT 0,
  show_in_board BOOLEAN NOT NULL DEFAULT true,
  is_open BOOLEAN NOT NULL DEFAULT true,
  is_terminal BOOLEAN NOT NULL DEFAULT false,
  resident_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE priority_levels (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  color_token TEXT NOT NULL DEFAULT 'gray',
  sort_order INTEGER NOT NULL DEFAULT 0,
  target_first_response_hours INTEGER,
  target_resolution_hours INTEGER,
  is_default BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE request_categories (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  icon_name TEXT,
  intake_hint TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE entry_preferences (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE request_sources (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE status_transitions (
  id SERIAL PRIMARY KEY,
  from_status_key TEXT NOT NULL REFERENCES request_statuses(key),
  to_status_key TEXT NOT NULL REFERENCES request_statuses(key),
  actor_role_key TEXT NOT NULL REFERENCES role_definitions(key),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(from_status_key, to_status_key, actor_role_key)
);

-- ============================================================
-- E. Vendors
-- ============================================================

CREATE TABLE vendors (
  id TEXT PRIMARY KEY DEFAULT 'vnd_' || substr(gen_random_uuid()::text, 1, 12),
  name TEXT NOT NULL,
  primary_contact_name TEXT,
  email TEXT,
  phone TEXT,
  trade_category_key TEXT REFERENCES request_categories(key),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'
);

-- ============================================================
-- F. Maintenance requests (core domain)
-- ============================================================

CREATE TABLE maintenance_requests (
  id TEXT PRIMARY KEY DEFAULT 'req_' || substr(gen_random_uuid()::text, 1, 12),
  request_number SERIAL,
  title TEXT NOT NULL,
  description TEXT,
  property_id TEXT NOT NULL REFERENCES properties(id),
  space_id TEXT REFERENCES spaces(id),
  category_key TEXT REFERENCES request_categories(key),
  priority_key TEXT NOT NULL REFERENCES priority_levels(key),
  status_key TEXT NOT NULL REFERENCES request_statuses(key) DEFAULT 'submitted',
  source_key TEXT REFERENCES request_sources(key) DEFAULT 'portal',
  requester_profile_user_id TEXT REFERENCES profiles(user_id),
  requester_name TEXT,
  requester_email TEXT,
  requester_phone TEXT,
  created_by_user_id TEXT,
  assignee_user_id TEXT REFERENCES profiles(user_id),
  vendor_id TEXT REFERENCES vendors(id),
  location_detail TEXT,
  entry_preference_key TEXT REFERENCES entry_preferences(key),
  pets_present BOOLEAN,
  preferred_visit_window TEXT,
  access_instructions TEXT,
  scheduled_start_at TIMESTAMPTZ,
  scheduled_end_at TIMESTAMPTZ,
  first_response_due_at TIMESTAMPTZ,
  resolution_due_at TIMESTAMPTZ,
  first_responded_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  resolution_summary TEXT,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}',
  is_overdue_notified BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_requests_property ON maintenance_requests(property_id);
CREATE INDEX idx_requests_status ON maintenance_requests(status_key);
CREATE INDEX idx_requests_requester ON maintenance_requests(requester_profile_user_id);
CREATE INDEX idx_requests_assignee ON maintenance_requests(assignee_user_id);
CREATE INDEX idx_requests_sla_deadlines ON maintenance_requests(first_response_due_at, resolution_due_at);

-- ============================================================
-- G. Comments, attachments, events
-- ============================================================

CREATE TABLE request_comments (
  id TEXT PRIMARY KEY DEFAULT 'cmt_' || substr(gen_random_uuid()::text, 1, 12),
  request_id TEXT NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  author_user_id TEXT,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'internal')),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_comments_request ON request_comments(request_id);

CREATE TABLE attachments (
  id TEXT PRIMARY KEY DEFAULT 'att_' || substr(gen_random_uuid()::text, 1, 12),
  request_id TEXT NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  comment_id TEXT REFERENCES request_comments(id) ON DELETE SET NULL,
  uploaded_by_user_id TEXT,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'internal')),
  bucket TEXT NOT NULL DEFAULT 'request-photos',
  object_path TEXT NOT NULL,
  file_name TEXT,
  mime_type TEXT,
  size_bytes INTEGER,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_attachments_request ON attachments(request_id);

CREATE TABLE request_events (
  id TEXT PRIMARY KEY DEFAULT 'evt_' || substr(gen_random_uuid()::text, 1, 12),
  request_id TEXT NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  actor_user_id TEXT,
  event_type TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'internal')),
  summary TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_request ON request_events(request_id);

-- ============================================================
-- H. Notification log
-- ============================================================

CREATE TABLE notification_log (
  id TEXT PRIMARY KEY DEFAULT 'ntf_' || substr(gen_random_uuid()::text, 1, 12),
  request_id TEXT REFERENCES maintenance_requests(id) ON DELETE SET NULL,
  recipient_email TEXT,
  template_key TEXT,
  delivery_status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
