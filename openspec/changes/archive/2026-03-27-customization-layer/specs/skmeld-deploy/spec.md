## MODIFIED Requirements

### Requirement: One-click deploy script
`deploy.ts` SHALL provision a Run402 project, build the React SPA, bundle deploy (schema + RLS + views + seed + functions + site + subdomain), invoke bootstrap, and print credentials + URLs. It SHALL read BUYER_PRIVATE_KEY and ADMIN_KEY from .env. After building the frontend, it SHALL read `src/custom/brand.json` and rewrite `site/index.html` to inject the brand title, Google Fonts links, and a `window.__SKMELD_BRAND__` script tag.

#### Scenario: Fresh deploy
- **WHEN** an operator runs `npx tsx deploy.ts`
- **THEN** a project SHALL be provisioned, the app SHALL be deployed with all components, bootstrap SHALL run, and the console SHALL print the subdomain URL + admin credentials

#### Scenario: Brand injection during deploy
- **WHEN** `deploy.ts` runs and `src/custom/brand.json` contains `{ "name": "PropDesk", "fonts": { "display": { "family": "Inter", "weights": [600, 700] } } }`
- **THEN** `site/index.html` SHALL be rewritten with `<title>PropDesk</title>`, a Google Fonts `<link>` for Inter:wght@600;700, and `<script>window.__SKMELD_BRAND__ = {...}</script>` before the site files are bundled for deployment
