# Data Dictionary

All tables live in the project's schema slot. All column names use snake_case.

## app_settings
Single-row app configuration. `id` is always 1.

| Column | Type | Description |
|--------|------|-------------|
| app_name | TEXT | App display name |
| company_name | TEXT | Business/org name |
| logo_url | TEXT | Logo image URL |
| theme_key | TEXT | Color theme (emerald, blue, indigo, rose, amber) |
| support_email | TEXT | Support contact email |
| support_phone | TEXT | Support contact phone |
| emergency_instructions | TEXT | Emergency banner text shown on report form |
| time_zone | TEXT | IANA timezone for display |
| allow_requester_priority_selection | BOOLEAN | Let residents choose priority |
| show_pets_field | BOOLEAN | Show pets question on report form |
| show_preferred_visit_window | BOOLEAN | Show visit window field |
| show_entry_preference | BOOLEAN | Show entry preference field |
| ui_labels | JSONB | Terminology overrides (requester, property, space, request) |
| metadata | JSONB | Extensibility escape hatch |

## role_definitions
Seeded roles: owner_admin, staff, resident.

## profiles
One row per app user. Linked to Run402 auth user via `user_id`.

| Column | Type | Description |
|--------|------|-------------|
| user_id | TEXT PK | Auth user ID |
| email | TEXT | User email |
| full_name | TEXT | Display name |
| phone | TEXT | Phone number |
| role_key | TEXT FK | Role (owner_admin, staff, resident) |
| is_active | BOOLEAN | Active flag |

## invites
Single-use invite tokens for onboarding users.

| Column | Type | Description |
|--------|------|-------------|
| token | TEXT UNIQUE | Invite token (used in claim URL) |
| email | TEXT | Invited email |
| role_key | TEXT FK | Role to assign |
| expires_at | TIMESTAMPTZ | Token expiry |
| accepted_at | TIMESTAMPTZ | When redeemed |
| metadata | JSONB | Contains space_ids for resident occupancy |

## properties
Physical locations (buildings, complexes).

## spaces
Units, rooms, or areas within a property. FK to properties.

## space_occupancies
Links residents to spaces. FK to profiles and spaces.

## request_statuses
Workflow status definitions. Data-driven — add/modify via SQL.

| Column | Type | Description |
|--------|------|-------------|
| key | TEXT PK | Status identifier |
| label | TEXT | Display label |
| color_token | TEXT | Color name for UI |
| board_order | INT | Column order on kanban board |
| show_in_board | BOOLEAN | Show as board column |
| is_open | BOOLEAN | Counts as "open" for metrics |
| is_terminal | BOOLEAN | Final state (closed, canceled) |

## priority_levels
SLA target definitions.

| Column | Type | Description |
|--------|------|-------------|
| key | TEXT PK | Priority identifier |
| target_first_response_hours | INT | SLA: hours to first response |
| target_resolution_hours | INT | SLA: hours to resolution |
| is_default | BOOLEAN | Default priority for new requests |

## request_categories
Issue type taxonomy with icons and intake hints.

## status_transitions
Allowed state machine transitions per role. Enforced by transition-request function.

## vendors
External contractor contact directory.

## maintenance_requests
Core domain object. One row per maintenance issue.

Key fields: title, description, property_id, space_id, category_key, priority_key, status_key, requester_profile_user_id, assignee_user_id, vendor_id, location_detail, scheduled dates, SLA due dates, resolution timestamps.

## request_comments
Append-only comments. `visibility` is 'public' or 'internal'.

## attachments
Photo metadata. Points to Run402 storage objects. `visibility` controls access.

## request_events
Audit trail. Every status change, assignment, and action is logged.

## notification_log
Email send records (when RESEND_API_KEY is configured).

## Views

| View | Purpose |
|------|---------|
| v_request_board | Denormalized board cards with joins, age, overdue flags |
| v_request_activity | Union of events + comments, chronological |
| v_request_export | Flat CSV-friendly export |
| v_request_metrics | Aggregate KPIs for reports dashboard |

All views use `SECURITY INVOKER` so RLS applies to the caller.
