-- SkMeld views — security invoker so RLS applies to the caller

-- ============================================================
-- Board view: denormalized cards for the kanban board
-- ============================================================
CREATE OR REPLACE VIEW v_request_board
WITH (security_invoker = true) AS
SELECT
  r.id,
  r.request_number,
  r.title,
  r.status_key,
  s.label AS status_label,
  s.color_token AS status_color,
  s.board_order AS status_board_order,
  r.priority_key,
  p.label AS priority_label,
  p.color_token AS priority_color,
  p.sort_order AS priority_sort_order,
  r.category_key,
  c.label AS category_label,
  c.icon_name AS category_icon,
  r.property_id,
  prop.name AS property_name,
  r.space_id,
  sp.name AS space_name,
  r.requester_name,
  r.requester_profile_user_id,
  r.assignee_user_id,
  assignee.full_name AS assignee_name,
  r.vendor_id,
  v.name AS vendor_name,
  r.scheduled_start_at,
  r.scheduled_end_at,
  r.first_response_due_at,
  r.resolution_due_at,
  r.first_responded_at,
  r.created_at,
  r.updated_at,
  (SELECT count(*)::int FROM attachments a WHERE a.request_id = r.id) AS attachment_count,
  EXTRACT(EPOCH FROM (now() - r.created_at)) / 3600 AS age_hours,
  CASE WHEN r.first_response_due_at IS NOT NULL AND r.first_responded_at IS NULL AND now() > r.first_response_due_at THEN true ELSE false END AS is_overdue_response,
  CASE WHEN r.resolution_due_at IS NOT NULL AND r.resolved_at IS NULL AND now() > r.resolution_due_at AND s.is_open THEN true ELSE false END AS is_overdue_resolution
FROM maintenance_requests r
LEFT JOIN request_statuses s ON s.key = r.status_key
LEFT JOIN priority_levels p ON p.key = r.priority_key
LEFT JOIN request_categories c ON c.key = r.category_key
LEFT JOIN properties prop ON prop.id = r.property_id
LEFT JOIN spaces sp ON sp.id = r.space_id
LEFT JOIN profiles assignee ON assignee.user_id = r.assignee_user_id
LEFT JOIN vendors v ON v.id = r.vendor_id;

-- ============================================================
-- Activity view: timeline of events + comments for a request
-- ============================================================
CREATE OR REPLACE VIEW v_request_activity
WITH (security_invoker = true) AS
SELECT
  e.id,
  e.request_id,
  'event' AS activity_type,
  e.event_type,
  e.visibility,
  e.summary AS body,
  e.actor_user_id,
  prof.full_name AS actor_name,
  e.payload,
  e.created_at
FROM request_events e
LEFT JOIN profiles prof ON prof.user_id = e.actor_user_id

UNION ALL

SELECT
  c.id,
  c.request_id,
  'comment' AS activity_type,
  NULL AS event_type,
  c.visibility,
  c.body,
  c.author_user_id AS actor_user_id,
  prof.full_name AS actor_name,
  NULL AS payload,
  c.created_at
FROM request_comments c
LEFT JOIN profiles prof ON prof.user_id = c.author_user_id

ORDER BY created_at ASC;

-- ============================================================
-- Export view: flat, CSV-friendly
-- ============================================================
CREATE OR REPLACE VIEW v_request_export
WITH (security_invoker = true) AS
SELECT
  r.request_number,
  r.title,
  prop.name AS property_name,
  sp.name AS space_name,
  c.label AS category,
  p.label AS priority,
  s.label AS status,
  r.requester_name,
  assignee.full_name AS assignee_name,
  v.name AS vendor_name,
  r.created_at,
  r.first_responded_at,
  r.resolved_at,
  r.closed_at,
  r.resolution_due_at,
  r.scheduled_start_at,
  r.scheduled_end_at,
  r.resolution_summary
FROM maintenance_requests r
LEFT JOIN request_statuses s ON s.key = r.status_key
LEFT JOIN priority_levels p ON p.key = r.priority_key
LEFT JOIN request_categories c ON c.key = r.category_key
LEFT JOIN properties prop ON prop.id = r.property_id
LEFT JOIN spaces sp ON sp.id = r.space_id
LEFT JOIN profiles assignee ON assignee.user_id = r.assignee_user_id
LEFT JOIN vendors v ON v.id = r.vendor_id
ORDER BY r.created_at DESC;

-- ============================================================
-- Metrics view: aggregates for reports dashboard
-- ============================================================
CREATE OR REPLACE VIEW v_request_metrics
WITH (security_invoker = true) AS
SELECT
  (SELECT count(*)::int FROM maintenance_requests r JOIN request_statuses s ON s.key = r.status_key WHERE s.is_open) AS open_count,
  (SELECT count(*)::int FROM maintenance_requests r JOIN request_statuses s ON s.key = r.status_key WHERE s.is_open AND r.resolution_due_at IS NOT NULL AND now() > r.resolution_due_at AND r.resolved_at IS NULL) AS overdue_count,
  (SELECT count(*)::int FROM maintenance_requests r JOIN request_statuses s ON s.key = r.status_key WHERE s.is_open AND r.assignee_user_id IS NULL) AS unassigned_count,
  (SELECT round(avg(EXTRACT(EPOCH FROM (r.first_responded_at - r.created_at)) / 3600)::numeric, 1) FROM maintenance_requests r WHERE r.first_responded_at IS NOT NULL AND r.created_at > now() - interval '30 days') AS avg_first_response_hours_30d,
  (SELECT round(avg(EXTRACT(EPOCH FROM (r.resolved_at - r.created_at)) / 3600)::numeric, 1) FROM maintenance_requests r WHERE r.resolved_at IS NOT NULL AND r.created_at > now() - interval '30 days') AS avg_resolution_hours_30d,
  (SELECT count(*)::int FROM request_events WHERE event_type = 'reopened' AND created_at > now() - interval '30 days') AS reopened_count_30d;
