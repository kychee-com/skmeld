## MODIFIED Requirements

### Requirement: Auth flow with role-based routing
The app SHALL support signup, login, and invite claim flows. After auth, the app SHALL look up the user's profile to determine role (owner_admin, staff, resident) and route accordingly: staff/admin to /app/board, residents to /app/my-requests. All user-facing strings in login and claim pages SHALL use `t()` for translation.

#### Scenario: Staff login
- **WHEN** a staff user logs in
- **THEN** they SHALL be routed to /app/board

#### Scenario: Resident login
- **WHEN** a resident logs in
- **THEN** they SHALL be routed to /app/my-requests

#### Scenario: Invite claim
- **WHEN** a user opens /claim?token=abc and signs up
- **THEN** the invite SHALL be redeemed, their profile created with the correct role, and they SHALL be routed to their role's home page

#### Scenario: Login page uses translated strings
- **WHEN** the login page renders
- **THEN** all labels (email, password, sign in button, brand name, session expired message) SHALL come from `t()` calls

### Requirement: Login page displays contextual messages
The login page SHALL display contextual feedback messages based on URL parameters. When `?expired=true` is present, the page MUST show the translated string for `toast.session_expired` in a visible banner above the form. The parameter MUST be removed from the URL after being read so it does not persist on reload.

#### Scenario: Session expired redirect
- **WHEN** the user is redirected to `/login?expired=true` after a forced logout
- **THEN** the login page shows the value of `t('toast.session_expired')` in an info-styled banner

#### Scenario: Login error after expired message
- **WHEN** the user sees the expired message and then submits invalid credentials
- **THEN** the expired message is replaced by the error message

### Requirement: Visual quality bar
The app SHALL have: loading skeletons, optimistic drag/drop, clean empty states, image preview + lightbox, dark mode, AA contrast targets, keyboard-accessible forms, and theme presets (emerald default, blue, indigo, rose, amber). Mobile-responsive across phone/tablet/desktop. The sidebar brand name SHALL use `t()` to display the configured app name.

#### Scenario: Dark mode
- **WHEN** user toggles dark mode
- **THEN** all pages SHALL render with dark theme colors while maintaining readability

#### Scenario: Performance
- **WHEN** board loads with 200 open requests
- **THEN** initial load SHALL complete in under 2 seconds

#### Scenario: Brand name in sidebar
- **WHEN** the app renders the sidebar
- **THEN** the brand name SHALL come from `t('nav.brand')` which interpolates `{app_name}` from brand.json

### Requirement: Admin pages
- **/app/properties**: list/add/edit/archive properties and spaces, CSV import
- **/app/people** (owner_admin only): active users, pending invites, invite staff/resident, CSV import residents
- **/app/vendors**: contact directory with trade/category, phone/email, notes, active/inactive
- **/app/settings** (owner_admin only): app_name, company_name, logo, theme, support contact, emergency instructions, time_zone, intake toggles. When `brand.json → languages` has more than one entry, a language picker SHALL be shown.
- **/app/reports**: KPI cards (open, overdue, unassigned, avg response time), charts by status/category/property, CSV export

#### Scenario: Admin adds property with spaces
- **WHEN** admin opens /app/properties and adds a property with 5 units
- **THEN** the property and spaces SHALL be created via PostgREST

#### Scenario: CSV export
- **WHEN** staff clicks export on /app/reports
- **THEN** a CSV file SHALL download with request data matching current filters

#### Scenario: Language picker in settings
- **WHEN** admin opens /app/settings and brand.json has `languages: ["en", "nl"]`
- **THEN** a language picker SHALL appear allowing the admin to switch the UI language
