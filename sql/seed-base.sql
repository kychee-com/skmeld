-- SkMeld seed data — base config (included in every deployment)

-- App settings (single row)
INSERT INTO app_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Roles
INSERT INTO role_definitions (key, label, sort_order) VALUES
  ('owner_admin', 'Owner / Admin', 1),
  ('staff', 'Staff', 2),
  ('resident', 'Resident', 3)
ON CONFLICT DO NOTHING;

-- Statuses
INSERT INTO request_statuses (key, label, color_token, board_order, show_in_board, is_open, is_terminal, resident_visible) VALUES
  ('submitted',            'New',                    'blue',    1, true,  true,  false, true),
  ('triaged',              'Under review',           'yellow',  2, true,  true,  false, true),
  ('scheduled',            'Scheduled',              'purple',  3, true,  true,  false, true),
  ('in_progress',          'In progress',            'orange',  4, true,  true,  false, true),
  ('waiting_on_resident',  'Waiting on you',         'pink',    5, true,  true,  false, true),
  ('waiting_on_vendor',    'Waiting on contractor',  'cyan',    6, true,  true,  false, true),
  ('resolved',             'Marked fixed',           'green',   7, true,  true,  false, true),
  ('closed',               'Closed',                 'gray',    8, false, false, true,  true),
  ('canceled',             'Canceled',               'gray',    9, false, false, true,  true)
ON CONFLICT DO NOTHING;

-- Priorities
INSERT INTO priority_levels (key, label, color_token, sort_order, target_first_response_hours, target_resolution_hours, is_default) VALUES
  ('low',    'Low',    'slate',  4, 72,  168, false),
  ('normal', 'Normal', 'blue',   3, 24,  72,  true),
  ('high',   'High',   'orange', 2, 8,   24,  false),
  ('urgent', 'Urgent', 'red',    1, 2,   8,   false)
ON CONFLICT DO NOTHING;

-- Categories
INSERT INTO request_categories (key, label, icon_name, intake_hint, sort_order, is_active) VALUES
  ('plumbing',    'Plumbing',        'Droplets',     'Leaks, clogs, toilets, faucets, water heater',        1, true),
  ('electrical',  'Electrical',      'Zap',          'Outlets, switches, breakers, lighting',                2, true),
  ('hvac',        'HVAC',            'Thermometer',  'Heating, cooling, ventilation, thermostat',            3, true),
  ('appliance',   'Appliance',       'Microwave',    'Refrigerator, oven, dishwasher, washer/dryer',         4, true),
  ('lock_access', 'Lock / Access',   'KeyRound',     'Locks, keys, access codes, garage doors',              5, true),
  ('pest',        'Pest Control',    'Bug',          'Insects, rodents, wildlife',                           6, true),
  ('damage',      'Damage / Safety', 'ShieldAlert',  'Structural damage, water damage, fire hazard, mold',  7, true),
  ('common_area', 'Common Area',     'Building2',    'Hallways, elevators, parking, landscaping',            8, true),
  ('cleaning',    'Cleaning',        'Sparkles',     'Deep cleaning, stains, debris',                       9, true),
  ('other',       'Other',           'HelpCircle',   'Anything not covered by other categories',            10, true)
ON CONFLICT DO NOTHING;

-- Entry preferences
INSERT INTO entry_preferences (key, label, sort_order) VALUES
  ('can_enter_if_away',        'You may enter even if I''m not home', 1),
  ('contact_first',            'Please contact me before entering',   2),
  ('do_not_enter_without_me',  'Do not enter without me present',     3)
ON CONFLICT DO NOTHING;

-- Request sources
INSERT INTO request_sources (key, label, sort_order) VALUES
  ('portal',      'Online portal', 1),
  ('phone',       'Phone call',    2),
  ('email',       'Email',         3),
  ('walkthrough', 'Walkthrough',   4),
  ('staff',       'Staff report',  5)
ON CONFLICT DO NOTHING;

-- Space types
INSERT INTO space_types (key, label, sort_order) VALUES
  ('unit',        'Unit',        1),
  ('common_area', 'Common Area', 2),
  ('suite',       'Suite',       3),
  ('office',      'Office',      4),
  ('room',        'Room',        5),
  ('amenity',     'Amenity',     6),
  ('parking',     'Parking',     7),
  ('other',       'Other',       8)
ON CONFLICT DO NOTHING;

-- Status transitions (who can move from where to where)
-- Staff/admin transitions
INSERT INTO status_transitions (from_status_key, to_status_key, actor_role_key) VALUES
  ('submitted',           'triaged',              'staff'),
  ('submitted',           'triaged',              'owner_admin'),
  ('submitted',           'scheduled',            'staff'),
  ('submitted',           'scheduled',            'owner_admin'),
  ('submitted',           'in_progress',          'staff'),
  ('submitted',           'in_progress',          'owner_admin'),
  ('submitted',           'canceled',             'staff'),
  ('submitted',           'canceled',             'owner_admin'),
  ('triaged',             'scheduled',            'staff'),
  ('triaged',             'scheduled',            'owner_admin'),
  ('triaged',             'in_progress',          'staff'),
  ('triaged',             'in_progress',          'owner_admin'),
  ('triaged',             'waiting_on_resident',  'staff'),
  ('triaged',             'waiting_on_resident',  'owner_admin'),
  ('triaged',             'waiting_on_vendor',    'staff'),
  ('triaged',             'waiting_on_vendor',    'owner_admin'),
  ('triaged',             'resolved',             'staff'),
  ('triaged',             'resolved',             'owner_admin'),
  ('triaged',             'canceled',             'staff'),
  ('triaged',             'canceled',             'owner_admin'),
  ('scheduled',           'in_progress',          'staff'),
  ('scheduled',           'in_progress',          'owner_admin'),
  ('scheduled',           'waiting_on_resident',  'staff'),
  ('scheduled',           'waiting_on_resident',  'owner_admin'),
  ('scheduled',           'waiting_on_vendor',    'staff'),
  ('scheduled',           'waiting_on_vendor',    'owner_admin'),
  ('scheduled',           'resolved',             'staff'),
  ('scheduled',           'resolved',             'owner_admin'),
  ('scheduled',           'canceled',             'staff'),
  ('scheduled',           'canceled',             'owner_admin'),
  ('in_progress',         'waiting_on_resident',  'staff'),
  ('in_progress',         'waiting_on_resident',  'owner_admin'),
  ('in_progress',         'waiting_on_vendor',    'staff'),
  ('in_progress',         'waiting_on_vendor',    'owner_admin'),
  ('in_progress',         'resolved',             'staff'),
  ('in_progress',         'resolved',             'owner_admin'),
  ('in_progress',         'canceled',             'staff'),
  ('in_progress',         'canceled',             'owner_admin'),
  ('waiting_on_resident', 'triaged',              'staff'),
  ('waiting_on_resident', 'triaged',              'owner_admin'),
  ('waiting_on_resident', 'in_progress',          'staff'),
  ('waiting_on_resident', 'in_progress',          'owner_admin'),
  ('waiting_on_resident', 'resolved',             'staff'),
  ('waiting_on_resident', 'resolved',             'owner_admin'),
  ('waiting_on_resident', 'canceled',             'staff'),
  ('waiting_on_resident', 'canceled',             'owner_admin'),
  ('waiting_on_vendor',   'triaged',              'staff'),
  ('waiting_on_vendor',   'triaged',              'owner_admin'),
  ('waiting_on_vendor',   'in_progress',          'staff'),
  ('waiting_on_vendor',   'in_progress',          'owner_admin'),
  ('waiting_on_vendor',   'resolved',             'staff'),
  ('waiting_on_vendor',   'resolved',             'owner_admin'),
  ('waiting_on_vendor',   'canceled',             'staff'),
  ('waiting_on_vendor',   'canceled',             'owner_admin'),
  ('resolved',            'triaged',              'staff'),
  ('resolved',            'triaged',              'owner_admin'),
  ('resolved',            'closed',               'staff'),
  ('resolved',            'closed',               'owner_admin'),
  -- Resident transitions (limited)
  ('resolved',            'closed',               'resident'),
  ('resolved',            'triaged',              'resident')
ON CONFLICT DO NOTHING;
