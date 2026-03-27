## ADDED Requirements

### Requirement: Translation function
The app SHALL export a `t(key, vars?)` function from `src/lib/i18n.ts` that resolves a namespaced string key to the current locale's translation. The function SHALL interpolate `{variable}` placeholders using the `vars` object. `{app_name}` SHALL always be available, populated from `brand.json → name`.

#### Scenario: Simple key lookup
- **WHEN** `t('nav.dashboard')` is called and the current locale is English
- **THEN** it SHALL return `"Dashboard"`

#### Scenario: Variable interpolation
- **WHEN** `t('toast.invite_sent', { email: 'a@b.com' })` is called
- **THEN** it SHALL return `"Invite sent to a@b.com"`

#### Scenario: App name interpolation
- **WHEN** `t('auth.login_cta')` is called and brand.json name is "PropDesk"
- **THEN** it SHALL return `"Sign in to PropDesk"`

### Requirement: Locale fallback chain
When resolving a key, `t()` SHALL follow this fallback chain: current locale → English → raw key. This ensures the app always renders visible text even with incomplete translations.

#### Scenario: Key missing in current locale
- **WHEN** the current locale is `nl` and `nl.json` does not contain `"toast.board_created"`
- **THEN** `t('toast.board_created')` SHALL return the English value `"Board created."`

#### Scenario: Key missing in all locales
- **WHEN** a key `"foo.bar"` exists in no locale file
- **THEN** `t('foo.bar')` SHALL return `"foo.bar"`

### Requirement: Plural convention
For countable strings, the app SHALL support a `_one` suffix convention. When `vars.count === 1`, the function SHALL look up `key_one` first; for all other counts, it SHALL use the base key. Both variants SHALL support `{count}` interpolation.

#### Scenario: Plural form
- **WHEN** `t('people.active_users', { count: 5 })` is called
- **THEN** it SHALL return `"5 active users"`

#### Scenario: Singular form
- **WHEN** `t('people.active_users', { count: 1 })` is called
- **THEN** it SHALL return `"1 active user"`

### Requirement: Locale string file format
Each locale SHALL be a JSON file at `public/custom/strings/{locale}.json`. The file SHALL contain a flat object with namespaced dot-separated keys. A `_meta` object SHALL declare `language` (locale code), `name` (human-readable), and `direction` (`"ltr"` or `"rtl"`).

#### Scenario: English locale file structure
- **WHEN** the app ships
- **THEN** `public/custom/strings/en.json` SHALL exist with `_meta.language: "en"`, `_meta.name: "English"`, `_meta.direction: "ltr"`, and all UI string keys

### Requirement: Runtime locale loading
The app SHALL load locale strings at startup by fetching `/custom/strings/{locale}.json`. The locale SHALL be determined by: saved preference in `localStorage` (key `skmeld.language`) → `brand.json → defaultLanguage` → `"en"`. English SHALL always be loaded as the fallback locale (unless it is the current locale, in which case it doubles as both).

#### Scenario: First visit with brand default
- **WHEN** a user visits for the first time and `brand.json.defaultLanguage` is `"nl"`
- **THEN** the app SHALL fetch `nl.json` and `en.json`, and set `skmeld.language` to `"nl"` in localStorage

#### Scenario: Returning visit with saved preference
- **WHEN** a user returns and `skmeld.language` is `"nl"` in localStorage
- **THEN** the app SHALL load `nl.json` as the primary locale

### Requirement: Language switching
The app SHALL expose a `setLanguage(locale)` function that updates localStorage, reloads the locale strings, and refreshes the UI. The language picker SHALL only be visible when `brand.json → languages` contains more than one entry.

#### Scenario: User switches language
- **WHEN** a user selects "Nederlands" from the language picker
- **THEN** the app SHALL update localStorage, load `nl.json`, and re-render all UI strings in Dutch

#### Scenario: Single language hides picker
- **WHEN** `brand.json → languages` is `["en"]`
- **THEN** no language picker SHALL be rendered
