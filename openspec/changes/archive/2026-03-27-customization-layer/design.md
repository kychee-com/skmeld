## Context

SkMeld is a React 19 + TypeScript + Vite SPA deployed on Run402. All UI strings are hardcoded across ~12 TSX files. The app already has a database-driven `app_settings` table for runtime config (theme, company name, feature toggles), but there is no mechanism for static white-labeling — changing the app name in the HTML title, swapping fonts, or translating the UI requires editing source files.

Krello (a sibling Run402 app) shipped a customization layer that solves this: a `site/custom/` directory with `brand.json`, `strings/{locale}.json`, and `templates/*.json`. The pattern proved effective. SkMeld will adopt the same architecture, adapted for its React/TypeScript stack.

Key difference from Krello: SkMeld is a compiled React app (Vite build), not a single `app.js` file. The i18n engine will be a TypeScript module (`src/lib/i18n.ts`) imported by components, rather than a global `t()` function in a script tag.

## Goals / Non-Goals

**Goals:**
- Fork owners can rebrand (name, logo, fonts, theme defaults) by editing one JSON file
- Fork owners can add languages by copying + translating a JSON string file
- All ~150 hardcoded UI strings extracted to `en.json` with namespaced keys
- Build-time injection of brand identity into `index.html` (no flash of defaults)
- Zero new runtime dependencies

**Non-Goals:**
- Server-side i18n (database labels like status names, categories stay in the DB)
- RTL layout support (add later when an RTL language is requested)
- Per-user language preference stored in the database (localStorage is sufficient)
- Translating the CUSTOMIZING.md guide itself

## Decisions

### 1. String files live in `public/custom/strings/`, brand config in `src/custom/brand.json`

**Choice:** Brand config is imported at build time (Vite JSON import), string files are fetched at runtime from the `public/` directory.

**Why:** Brand config affects `index.html` compilation (fonts, title, meta) and must be available at build time. String files are ~10KB each and loading them at runtime avoids bundling every locale into the JS — only the active locale is fetched. Vite copies `public/` contents to `site/` as-is.

**Alternative considered:** Bundle all locales into the JS. Rejected — adds unnecessary bundle size for multi-language deployments and requires a rebuild to add a language.

### 2. `t()` as a module-level function, not a React hook

**Choice:** Export a plain `t(key, vars?)` function from `src/lib/i18n.ts`. Components call it directly in JSX.

**Why:** The vast majority of strings are static per render. A plain function is simpler than a hook/context and avoids re-render cascading. Language switching (rare — settings page only) calls `setLanguage()` which updates the module-level string maps and triggers a full re-render via React Query invalidation or a simple `window.location.reload()`.

**Alternative considered:** React context + `useTranslation()` hook. Rejected — over-engineered for the use case. The reload-on-language-change tradeoff is acceptable since users change language once, not per-session.

### 3. Deploy.ts compiles `index.html` from brand.json post-build

**Choice:** After `npm run build`, `deploy.ts` reads `brand.json` and rewrites `site/index.html` — injecting `<title>`, Google Fonts `<link>`, CSS custom properties, and a `window.__SKMELD_BRAND__` script tag.

**Why:** Prevents flash of default brand name in the tab title and avoids font-swap flicker. Same approach Krello uses. The brand config is small enough to inline.

**Alternative considered:** Vite plugin that reads brand.json during build. Rejected — adds build complexity and couples the customization layer to the build tool.

### 4. Plural convention: `_one` suffix

**Choice:** For countable strings, the base key is used for all counts except 1, and `key_one` is used for count === 1. Example: `"board.members": "{count} members"`, `"board.members_one": "{count} member"`.

**Why:** Same convention as Krello. Covers English and most European languages. CLDR-level plural rules are overkill for this use case.

### 5. No template files (unlike Krello)

**Choice:** Skip the `templates/*.json` pattern. SkMeld's workflow is data-driven via seed SQL (statuses, priorities, categories), not board templates.

**Why:** Krello templates define board layouts (lists + cards). SkMeld's equivalent — statuses, categories, priorities — already lives in `seed-base.sql` and is configured via the Settings page. Adding a template layer would duplicate existing config.

## Risks / Trade-offs

**[Risk] String key drift** — New components added later may use hardcoded strings instead of `t()` calls.
→ Mitigation: CUSTOMIZING.md documents the convention. A future lint rule could flag raw string literals in JSX.

**[Risk] Missing translations** — A locale file may not have all keys.
→ Mitigation: `t()` falls back to English, then to the raw key. The app always renders something.

**[Risk] Build-time HTML rewriting is fragile** — If `index.html` structure changes, the deploy.ts injection may break.
→ Mitigation: Use marker comments (`<!-- BRAND:TITLE -->`) or simple string replacement on known patterns. Keep the index.html template minimal.
