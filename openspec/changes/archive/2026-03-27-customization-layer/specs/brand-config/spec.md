## ADDED Requirements

### Requirement: Brand configuration file
The app SHALL read brand identity from `src/custom/brand.json`. The file SHALL contain: `name` (string), `tagline` (string), `logo` (path relative to public/), `favicon` (path relative to public/), `fonts` (object with `display` and `body` sub-objects), `languages` (array of locale codes), `defaultLanguage` (string), `defaultTheme` (string), `defaultAccent` (string).

#### Scenario: Brand file defines app identity
- **WHEN** `brand.json` contains `{ "name": "PropDesk", "tagline": "Maintenance made easy." }`
- **THEN** the app name SHALL appear as "PropDesk" in the sidebar, login page, and page title

### Requirement: Font configuration
`brand.json → fonts` SHALL declare `display` (headings, brand wordmark) and `body` (text, buttons, inputs) font families with weight arrays and a `source` field (`"google"` for Google Fonts CDN). At runtime, the app SHALL set CSS custom properties `--font-display` and `--font-body`.

#### Scenario: Custom fonts applied
- **WHEN** `brand.json` specifies `fonts.display.family: "Inter"` and `fonts.body.family: "Inter"`
- **THEN** CSS custom property `--font-display` SHALL be set to `"Inter", sans-serif` and `--font-body` SHALL be set to `"Inter", sans-serif`

### Requirement: Build-time HTML injection
`deploy.ts` SHALL read `brand.json` after building the frontend and rewrite `site/index.html` to inject: the `<title>` tag with the brand name, Google Fonts `<link>` tags for configured font families and weights, and a `<script>` tag setting `window.__SKMELD_BRAND__` with the brand config object. This prevents flash of default brand.

#### Scenario: Deployed index.html has brand
- **WHEN** `deploy.ts` runs with `brand.json → name: "PropDesk"` and `fonts.display.family: "Fraunces"`
- **THEN** `site/index.html` SHALL contain `<title>PropDesk</title>`, a Google Fonts link for Fraunces, and `window.__SKMELD_BRAND__ = { ... }`

### Requirement: Theme and accent defaults
`brand.json → defaultTheme` and `defaultAccent` SHALL set the initial theme for new users who have no saved preference. The values SHALL correspond to SkMeld's existing theme keys (emerald, blue, indigo, rose, amber).

#### Scenario: Default theme applied on first visit
- **WHEN** a new user visits and `brand.json.defaultTheme` is `"blue"`
- **THEN** the app SHALL render with the blue theme until the user changes it in settings
