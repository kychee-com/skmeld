# Customizing SkMeld

> This guide is designed for coding agents (Claude Code, Cursor, etc.).
> All customization lives in `src/custom/` and `public/custom/`. Never modify component files for branding.

## Quick start

1. Edit `src/custom/brand.json` — name, tagline, theme, fonts
2. Replace `public/custom/logo.svg` with your logo
3. To add a language: copy `public/custom/strings/en.json` to `public/custom/strings/{locale}.json`, translate values
4. Add the locale code to `brand.json` → `languages` array
5. Deploy with `npm run deploy`

## Brand identity

**File:** `src/custom/brand.json`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | string | `"SkMeld"` | App name — appears in sidebar, login, page title, and `{app_name}` in strings |
| `tagline` | string | `"Property maintenance..."` | One-liner shown in page meta description |
| `logo` | path | `"custom/logo.svg"` | SVG logo relative to `public/` |
| `favicon` | path | `"favicon.svg"` | Favicon relative to `public/` |
| `defaultTheme` | string | `"emerald"` | One of: `emerald`, `blue`, `indigo`, `rose`, `amber` |
| `defaultAccent` | string | `"emerald"` | Same options as theme |

## Fonts

**File:** `src/custom/brand.json` → `fonts`

| Field | Default | Description |
|-------|---------|-------------|
| `display.family` | `"Inter"` | Headings, brand wordmark |
| `display.weights` | `[600, 700]` | Font weights to load |
| `body.family` | `"Inter"` | Body text, buttons, inputs |
| `body.weights` | `[400, 500, 700]` | Font weights to load |
| `source` | `"google"` | `"google"` loads from Google Fonts CDN |

For CJK languages, use Noto Sans/Serif variants (e.g., `"Noto Sans JP"`).
For Arabic/Hebrew, also set `_meta.direction` to `"rtl"` in the strings file.

## Languages

**Directory:** `public/custom/strings/`
**Default:** `en.json` (always shipped, used as fallback for missing keys)

### Adding a language

1. Copy `public/custom/strings/en.json` to `public/custom/strings/{locale}.json` (e.g., `es.json`)
2. Translate all string values — keys must stay identical
3. Update the `_meta` object: set `language`, `name` (human-readable), and `direction`
4. Add the locale code to `brand.json` → `languages` array (e.g., `["en", "es"]`)
5. Set `brand.json` → `defaultLanguage` to the preferred default

### String conventions

- `{app_name}` is automatically replaced with `brand.json` → `name`
- `{count}` is used for numeric interpolation
- `{variable}` placeholders must be kept as-is in translations
- For plurals: translate both the base key and the `_one` variant (e.g., `properties.spaces_count` and `properties.spaces_count_one`)
- The `_one` variant is used when `count === 1`

### Example

```json
{
  "_meta": { "language": "es", "name": "Español", "direction": "ltr" },
  "auth.brand": "{app_name}",
  "nav.board": "Tablero",
  "nav.my_requests": "Mis solicitudes",
  "properties.spaces_count": "{count} espacios",
  "properties.spaces_count_one": "{count} espacio"
}
```

## Logo

Replace `public/custom/logo.svg` with your logo. Recommended: square SVG that works on both light and dark backgrounds.

Update `brand.json` → `logo` if you use a different filename or path.

## Complete example

To rebrand SkMeld as "OfficeDesk" with Spanish and English:

```json
// src/custom/brand.json
{
  "name": "OfficeDesk",
  "tagline": "Gestión de mantenimiento para oficinas.",
  "logo": "custom/logo.svg",
  "favicon": "favicon.svg",
  "fonts": {
    "display": { "family": "Inter", "weights": [600, 700] },
    "body": { "family": "Inter", "weights": [400, 500, 700] },
    "source": "google"
  },
  "languages": ["es", "en"],
  "defaultLanguage": "es",
  "defaultTheme": "blue",
  "defaultAccent": "blue"
}
```

Then copy `en.json` to `es.json` and translate all values.
