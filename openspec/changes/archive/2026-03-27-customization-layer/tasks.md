## 1. Brand config and i18n engine

- [x] 1.1 Create `src/custom/brand.json` with SkMeld defaults (name, tagline, logo, favicon, fonts, languages, defaultLanguage, defaultTheme, defaultAccent)
- [x] 1.2 Create `src/lib/i18n.ts` — export `t(key, vars?)`, `initI18n()`, `setLanguage(locale)`, `currentLanguage()` with locale fallback chain and `_one` plural convention
- [x] 1.3 Create `public/custom/strings/en.json` with all ~150 extracted UI strings using namespaced keys and `{app_name}` / `{count}` interpolation
- [x] 1.4 Add `public/custom/logo.svg` placeholder logo

## 2. Extract hardcoded strings from components

- [x] 2.1 Replace strings in `src/pages/login.tsx` with `t()` calls (email, password, sign in, brand name, session expired message)
- [x] 2.2 Replace strings in `src/pages/claim.tsx` with `t()` calls (invalid link, welcome, create account)
- [x] 2.3 Replace strings in `src/components/app-layout.tsx` with `t()` calls (nav items, brand name, sign out)
- [x] 2.4 Replace strings in `src/pages/board.tsx` and board sub-components with `t()` calls (column headers, empty states, filters)
- [x] 2.5 Replace strings in `src/pages/my-requests.tsx` with `t()` calls (headings, empty states, status groups)
- [x] 2.6 Replace strings in `src/pages/report.tsx` with `t()` calls (form labels, placeholders, submit button)
- [x] 2.7 Replace strings in `src/pages/properties.tsx` with `t()` calls (headings, buttons, empty states)
- [x] 2.8 Replace strings in `src/pages/people.tsx` with `t()` calls (headings, invite form, role labels)
- [x] 2.9 Replace strings in `src/pages/vendors.tsx` with `t()` calls (headings, form fields)
- [x] 2.10 Replace strings in `src/pages/reports.tsx` with `t()` calls (KPI labels, export)
- [x] 2.11 Replace strings in `src/pages/settings.tsx` with `t()` calls (field labels, theme options)
- [x] 2.12 Replace strings in `src/pages/request-detail.tsx` and related components (activity timeline, comment composer, status actions) with `t()` calls

## 3. Integrate i18n into app bootstrap

- [x] 3.1 Call `initI18n()` in `src/main.tsx` before rendering the app (await locale load, then mount React)
- [x] 3.2 Read `brand.json` at startup and apply CSS custom properties for `--font-display` and `--font-body`
- [x] 3.3 Add language picker to settings page — visible only when `brand.json → languages` has more than one entry

## 4. Deploy-time brand injection

- [x] 4.1 Update `deploy.ts` to read `src/custom/brand.json` after `npm run build`
- [x] 4.2 Rewrite `site/index.html` to inject `<title>`, Google Fonts `<link>` tags, and `window.__SKMELD_BRAND__` script tag from brand config
- [x] 4.3 Update `index.html` template with marker comments or placeholders for brand injection points

## 5. Documentation and verification

- [x] 5.1 Create `CUSTOMIZING.md` with agent-facing guide: brand identity, fonts, adding languages, theme defaults, complete rebrand example
- [x] 5.2 Verify the app builds successfully with `npm run build`
- [x] 5.3 Verify all `t()` keys in components have corresponding entries in `en.json`
