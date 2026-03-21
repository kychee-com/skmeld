-- SkMeld demo seed data — creates realistic sample data for demos
-- Run AFTER seed-base.sql. Do NOT include in published marketplace bundles.

-- Demo properties
INSERT INTO properties (id, name, code, street_1, city, state, postal_code) VALUES
  ('prop_oakridge',    'Oakridge Apartments',  'OAK',  '1200 Oak Ridge Dr',    'Austin',  'TX', '78704'),
  ('prop_maplewood',   'Maplewood Townhomes',  'MPL',  '345 Maplewood Lane',   'Austin',  'TX', '78745');

-- Demo spaces
INSERT INTO spaces (id, property_id, name, code, space_type_key, floor) VALUES
  ('spc_oak_101', 'prop_oakridge',  'Unit 101', '101', 'unit', '1'),
  ('spc_oak_102', 'prop_oakridge',  'Unit 102', '102', 'unit', '1'),
  ('spc_oak_201', 'prop_oakridge',  'Unit 201', '201', 'unit', '2'),
  ('spc_oak_202', 'prop_oakridge',  'Unit 202', '202', 'unit', '2'),
  ('spc_oak_301', 'prop_oakridge',  'Unit 301', '301', 'unit', '3'),
  ('spc_oak_pool', 'prop_oakridge', 'Pool Area', 'POOL', 'amenity', NULL),
  ('spc_oak_lobby', 'prop_oakridge', 'Main Lobby', 'LOBBY', 'common_area', '1'),
  ('spc_mpl_a',   'prop_maplewood', 'Unit A',   'A',   'unit', '1'),
  ('spc_mpl_b',   'prop_maplewood', 'Unit B',   'B',   'unit', '1'),
  ('spc_mpl_c',   'prop_maplewood', 'Unit C',   'C',   'unit', '1'),
  ('spc_mpl_d',   'prop_maplewood', 'Unit D',   'D',   'unit', '2');

-- Demo vendors
INSERT INTO vendors (id, name, primary_contact_name, email, phone, trade_category_key, is_active) VALUES
  ('vnd_ace',    'Ace Plumbing',          'Mike Torres',    'mike@aceplumbing.example',   '512-555-0101', 'plumbing', true),
  ('vnd_spark',  'Spark Electric',        'Dana Lee',       'dana@sparkelectric.example', '512-555-0202', 'electrical', true),
  ('vnd_cool',   'CoolAir HVAC',          'James Park',     'james@coolair.example',      '512-555-0303', 'hvac', true);

-- Update app settings for demo
UPDATE app_settings SET
  app_name = 'Oakridge & Maplewood',
  company_name = 'Sunrise Property Management',
  support_email = 'support@sunrise-demo.example',
  support_phone = '512-555-0000',
  emergency_instructions = 'For after-hours emergencies (flooding, gas leak, no heat in winter), call our emergency line at 512-555-9911.',
  allow_requester_priority_selection = true
WHERE id = 1;

-- Demo maintenance requests (across various statuses)
INSERT INTO maintenance_requests (id, request_number, title, description, property_id, space_id, category_key, priority_key, status_key, source_key, requester_name, requester_email, location_detail, entry_preference_key, first_response_due_at, resolution_due_at, created_at, updated_at) VALUES
  -- New/submitted
  ('req_demo_01', 1001, 'Kitchen faucet dripping constantly', 'The kitchen faucet has been dripping for 2 days. It''s getting worse — water pools on the counter overnight.', 'prop_oakridge', 'spc_oak_101', 'plumbing', 'normal', 'submitted', 'portal', 'Sarah Chen', 'sarah@example.com', 'Kitchen sink, left handle', 'can_enter_if_away', now() + interval '24 hours', now() + interval '72 hours', now() - interval '3 hours', now() - interval '3 hours'),

  -- Triaged / under review
  ('req_demo_02', 1002, 'Bathroom light flickering', 'The overhead light in the master bathroom flickers every few seconds. Started yesterday.', 'prop_oakridge', 'spc_oak_202', 'electrical', 'normal', 'triaged', 'portal', 'Marcus Johnson', 'marcus@example.com', 'Master bathroom ceiling fixture', 'contact_first', now() + interval '20 hours', now() + interval '68 hours', now() - interval '8 hours', now() - interval '4 hours'),

  -- Scheduled
  ('req_demo_03', 1003, 'AC not cooling properly', 'The apartment barely cools below 78°F even with the thermostat set to 72. Filter was changed last month.', 'prop_oakridge', 'spc_oak_301', 'hvac', 'high', 'scheduled', 'phone', 'Lisa Park', 'lisa@example.com', 'Living room thermostat and outdoor unit', 'can_enter_if_away', now() - interval '2 hours', now() + interval '16 hours', now() - interval '14 hours', now() - interval '6 hours'),

  -- In progress
  ('req_demo_04', 1004, 'Dishwasher not draining', 'Dishwasher fills with water but won''t drain at the end of the cycle. Standing water in the bottom after every run.', 'prop_maplewood', 'spc_mpl_a', 'appliance', 'normal', 'in_progress', 'portal', 'Tom Wilson', 'tom@example.com', 'Kitchen dishwasher — GE model', 'can_enter_if_away', now() - interval '12 hours', now() + interval '48 hours', now() - interval '36 hours', now() - interval '12 hours'),

  -- Waiting on resident
  ('req_demo_05', 1005, 'Front door deadbolt sticking', 'The deadbolt is very hard to turn. I have to jiggle the key for 30 seconds to lock/unlock.', 'prop_oakridge', 'spc_oak_102', 'lock_access', 'normal', 'waiting_on_resident', 'portal', 'Amy Rivera', 'amy@example.com', 'Front entrance door', 'do_not_enter_without_me', now() - interval '16 hours', now() + interval '32 hours', now() - interval '40 hours', now() - interval '16 hours'),

  -- Waiting on vendor
  ('req_demo_06', 1006, 'Water heater making loud popping sounds', 'The water heater in the utility closet makes loud popping/banging noises, especially in the morning. Hot water works but I''m worried.', 'prop_maplewood', 'spc_mpl_b', 'plumbing', 'high', 'waiting_on_vendor', 'portal', 'David Kim', 'david@example.com', 'Utility closet off the hallway', 'can_enter_if_away', now() - interval '4 hours', now() + interval '12 hours', now() - interval '18 hours', now() - interval '10 hours'),

  -- URGENT — overdue
  ('req_demo_07', 1007, 'Pipe burst under kitchen sink — water leaking', 'Water is actively leaking from a pipe under the kitchen sink. I turned off the valve but it''s still dripping. Towels on the floor.', 'prop_oakridge', 'spc_oak_201', 'plumbing', 'urgent', 'in_progress', 'phone', 'Rachel Torres', 'rachel@example.com', 'Under kitchen sink — cold water pipe', 'can_enter_if_away', now() - interval '3 hours', now() - interval '1 hour', now() - interval '5 hours', now() - interval '2 hours'),

  -- Resolved (awaiting resident confirmation)
  ('req_demo_08', 1008, 'Garbage disposal jammed', 'The garbage disposal makes a humming sound but doesn''t spin. Reset button didn''t help.', 'prop_maplewood', 'spc_mpl_c', 'appliance', 'low', 'resolved', 'portal', 'Kevin Nguyen', 'kevin@example.com', 'Kitchen sink garbage disposal', 'can_enter_if_away', now() - interval '60 hours', now() - interval '24 hours', now() - interval '96 hours', now() - interval '24 hours'),

  -- Common area request
  ('req_demo_09', 1009, 'Pool gate latch broken', 'The pool gate doesn''t latch shut properly. It swings open on its own — safety concern.', 'prop_oakridge', 'spc_oak_pool', 'common_area', 'high', 'triaged', 'staff', 'Maintenance Staff', 'staff@sunrise-demo.example', 'Pool gate entrance on the west side', NULL, now() + interval '4 hours', now() + interval '20 hours', now() - interval '6 hours', now() - interval '4 hours'),

  -- Closed
  ('req_demo_10', 1010, 'Smoke detector beeping', 'Smoke detector in hallway beeps every 30 seconds. Battery replacement needed.', 'prop_oakridge', 'spc_oak_102', 'electrical', 'normal', 'closed', 'portal', 'Amy Rivera', 'amy@example.com', 'Hallway ceiling smoke detector', 'can_enter_if_away', now() - interval '90 hours', now() - interval '50 hours', now() - interval '120 hours', now() - interval '72 hours');

-- Set timestamps on resolved/closed requests
UPDATE maintenance_requests SET
  first_responded_at = created_at + interval '2 hours',
  resolved_at = created_at + interval '72 hours',
  resolution_summary = 'Replaced jammed disposal unit with new InSinkErator. Tested with ice and running water — working properly.'
WHERE id = 'req_demo_08';

UPDATE maintenance_requests SET
  first_responded_at = created_at + interval '1 hour',
  resolved_at = created_at + interval '24 hours',
  closed_at = created_at + interval '48 hours',
  resolution_summary = 'Replaced 9V battery in hallway smoke detector. Tested alarm — functioning correctly.'
WHERE id = 'req_demo_10';

UPDATE maintenance_requests SET first_responded_at = created_at + interval '30 minutes' WHERE id = 'req_demo_07';
UPDATE maintenance_requests SET first_responded_at = created_at + interval '4 hours' WHERE id IN ('req_demo_03', 'req_demo_04', 'req_demo_05', 'req_demo_06');
UPDATE maintenance_requests SET vendor_id = 'vnd_ace' WHERE id IN ('req_demo_06', 'req_demo_07');
UPDATE maintenance_requests SET vendor_id = 'vnd_cool' WHERE id = 'req_demo_03';

-- Demo comments
INSERT INTO request_comments (id, request_id, author_user_id, visibility, body, created_at) VALUES
  ('cmt_demo_01', 'req_demo_05', NULL, 'public', 'Hi Amy, we need to schedule a time for the locksmith to come. Are you available this Thursday or Friday afternoon?', now() - interval '16 hours'),
  ('cmt_demo_02', 'req_demo_06', NULL, 'internal', 'Contacted Ace Plumbing — they can come Wednesday morning. May need to replace the anode rod. Parts ordered.', now() - interval '10 hours'),
  ('cmt_demo_03', 'req_demo_06', NULL, 'public', 'We''ve scheduled a plumber for Wednesday morning. The unit may need the water heater flushed. We''ll update you after the visit.', now() - interval '9 hours'),
  ('cmt_demo_04', 'req_demo_08', NULL, 'public', 'All done! New disposal installed and tested. Let us know if you have any issues.', now() - interval '24 hours');

-- Demo events
INSERT INTO request_events (id, request_id, actor_user_id, event_type, visibility, summary, created_at) VALUES
  ('evt_demo_01', 'req_demo_02', NULL, 'status_changed', 'public', 'Status changed from New to Under review', now() - interval '4 hours'),
  ('evt_demo_02', 'req_demo_03', NULL, 'status_changed', 'public', 'Status changed from New to Scheduled', now() - interval '6 hours'),
  ('evt_demo_03', 'req_demo_03', NULL, 'assigned', 'internal', 'Assigned to CoolAir HVAC', now() - interval '6 hours'),
  ('evt_demo_04', 'req_demo_04', NULL, 'status_changed', 'public', 'Status changed from New to In progress', now() - interval '12 hours'),
  ('evt_demo_05', 'req_demo_05', NULL, 'status_changed', 'public', 'Status changed to Waiting on you', now() - interval '16 hours'),
  ('evt_demo_06', 'req_demo_07', NULL, 'status_changed', 'public', 'Status changed from New to In progress', now() - interval '2 hours'),
  ('evt_demo_07', 'req_demo_07', NULL, 'assigned', 'internal', 'Assigned to Ace Plumbing — emergency', now() - interval '2 hours'),
  ('evt_demo_08', 'req_demo_08', NULL, 'status_changed', 'public', 'Marked as fixed', now() - interval '24 hours'),
  ('evt_demo_09', 'req_demo_09', NULL, 'status_changed', 'public', 'Status changed from New to Under review', now() - interval '4 hours'),
  ('evt_demo_10', 'req_demo_10', NULL, 'status_changed', 'public', 'Closed by resident', now() - interval '72 hours');
