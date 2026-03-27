## Why

SkMeld is a forkable, open-source property maintenance tracker. Fork owners currently cannot rebrand, translate, or customize the UI without editing React source files — which means every fork diverges from upstream and loses easy updates. Krello solved this with a `site/custom/` JSON-driven customization layer. SkMeld needs the same: a single directory of JSON files that lets agents (or humans) white-label the app without touching TSX.

## What Changes

- **Brand config file** (`src/custom/brand.json`): app name, tagline, logo path, font families/weights, language list, default theme/accent — injected at build time so `index.html` has no flash of defaults.
- **i18n string files** (`src/custom/strings/{locale}.json`): ~150 namespaced UI strings extracted from all TSX files. `{app_name}` interpolation, `_one` plural convention, runtime locale switching with English fallback.
- **`t()` translation function**: lightweight runtime lookup (current locale → English fallback → raw key), exposed as a React hook/utility so every component can call `t('key', { vars })`.
- **Deploy-time brand injection**: `deploy.ts` reads `brand.json` and injects `window.__SKMELD_BRAND__` into the built `index.html`, plus compiles font links and meta tags.
- **Language picker**: shown in Settings page when more than one language is configured.
- **Agent customization guide** (`CUSTOMIZING.md`): structured instructions for coding agents to rebrand, add languages, and adjust themes.

## Capabilities

### New Capabilities
- `i18n`: Runtime translation engine — `t()` function, locale loading, string file format, plural convention, language switching
- `brand-config`: Brand identity configuration — `brand.json` schema, font injection, build-time HTML compilation, theme/accent defaults
- `customization-guide`: Agent-facing guide for white-labeling — structured CUSTOMIZING.md with rebrand walkthrough

### Modified Capabilities
- `skmeld-frontend`: All hardcoded UI strings replaced with `t()` calls; language picker added to Settings
- `skmeld-deploy`: `deploy.ts` reads `brand.json` and injects brand globals into built HTML

## Impact

- **Frontend (`src/`)**: Every component with hardcoded strings is touched (~12 files). No behavioral changes — only string extraction.
- **Build (`deploy.ts`)**: New pre-deploy step to compile `index.html` from brand config.
- **New files**: `src/custom/brand.json`, `src/custom/strings/en.json`, `src/lib/i18n.ts`, `CUSTOMIZING.md`
- **Dependencies**: None added. The i18n engine is hand-rolled (~30 lines), no library needed.
- **Database**: No schema changes. The existing `app_settings.app_name` continues to work; `brand.json` governs the static shell, `app_settings` governs runtime behavior.
