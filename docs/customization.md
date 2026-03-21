# Customization Guide

SkMeld is designed to be customized by coding agents. Change branding, terminology, categories, statuses, and more by updating data tables — no code changes needed for most customizations.

## Branding

Update `app_settings` (single-row table):

```sql
UPDATE app_settings SET
  app_name = 'Sunrise Properties',
  company_name = 'Sunrise Property Management',
  support_email = 'support@sunrise.com',
  support_phone = '512-555-0000',
  emergency_instructions = 'For emergencies, call 512-555-9911.',
  theme_key = 'blue'  -- emerald | blue | indigo | rose | amber
WHERE id = 1;
```

## Terminology (ui_labels)

Rename "Resident" to "Member", "Unit" to "Home", etc:

```sql
UPDATE app_settings SET ui_labels = '{
  "requester_singular": "Member",
  "requester_plural": "Members",
  "property_singular": "Community",
  "property_plural": "Communities",
  "space_singular": "Home",
  "space_plural": "Homes",
  "request_singular": "Request",
  "request_plural": "Requests"
}'::jsonb WHERE id = 1;
```

## Categories

Add, remove, or modify categories:

```sql
-- Add a category
INSERT INTO request_categories (key, label, icon_name, intake_hint, sort_order)
VALUES ('landscaping', 'Landscaping', 'Trees', 'Lawn, hedges, irrigation, tree trimming', 11);

-- Deactivate a category
UPDATE request_categories SET is_active = false WHERE key = 'pest';
```

Icons use [Lucide](https://lucide.dev) icon names.

## Priorities

Adjust SLA targets:

```sql
UPDATE priority_levels SET
  target_first_response_hours = 4,
  target_resolution_hours = 12
WHERE key = 'high';
```

## Status Labels

Change how statuses appear in the UI:

```sql
UPDATE request_statuses SET label = 'Assigned' WHERE key = 'triaged';
UPDATE request_statuses SET label = 'On Hold' WHERE key = 'waiting_on_vendor';
```

## Intake Form Toggles

Control which fields appear on the resident report form:

```sql
UPDATE app_settings SET
  allow_requester_priority_selection = true,  -- let residents set priority
  show_pets_field = false,                    -- hide pets question
  show_preferred_visit_window = true,         -- show scheduling preference
  show_entry_preference = true                -- show entry preference
WHERE id = 1;
```

## Theme

Available presets: `emerald` (default), `blue`, `indigo`, `rose`, `amber`. Set via `theme_key` in app_settings. Dark mode is user-toggled in the UI.

## Adding Status Transitions

If you add custom statuses, define allowed transitions:

```sql
-- Allow staff to move from 'on_hold' to 'in_progress'
INSERT INTO status_transitions (from_status_key, to_status_key, actor_role_key)
VALUES ('on_hold', 'in_progress', 'staff');
```
