# SkMeld

**Maintenance requests with photos, a real triage board, and resident updates — open source, forkable, no seat fees.**

SkMeld is a property maintenance request tracker for individual landlords, small property managers, HOAs, and office/facilities managers. It's the SaaS killer for Property Meld: free to use, free to customize, deploy on your own infrastructure.

## Features

- **Resident portal** — submit issues with photos, track status, confirm fixes
- **Staff board** — kanban triage with drag/drop, filters, SLA tracking
- **Role-based access** — owner/admin, staff, resident with RLS isolation
- **Configurable workflows** — statuses, priorities, categories are data tables
- **Bootstrap** — first-admin setup + optional demo data via one API call
- **Forkable** — published on Run402 marketplace, fork and customize with your agent

## Deploy with Run402 CLI

```bash
# 1. Install the CLI and set up your account (one-time)
npm install -g run402
run402 init
run402 tier set prototype    # free tier (testnet USDC)

# 2. Provision project
run402 projects provision --name skmeld
# → note the project_id and anon_key from the output

# 3. Install dependencies and build frontend with your anon_key
npm install
VITE_ANON_KEY=<anon_key> npx vite build --outDir site --emptyOutDir

# 4. Create deploy manifest (app.json)
#    - migrations_file: concatenate sql/schema.sql + sql/seed-base.sql + sql/rls.sql + sql/views.sql
#    - functions: each .ts file in functions/ as { name, code }
#    - files: each file in site/ as { file, data }
#    - subdomain: "skmeld" (or your preferred name)
#    - project_id: from step 2
cat sql/schema.sql sql/seed-base.sql sql/rls.sql sql/views.sql > deploy-migrations.sql

# 5. Bundle deploy (migrations + functions + site + subdomain in one call)
run402 deploy --manifest app.json

# 6. Bootstrap first admin + demo data
run402 functions invoke <project_id> bootstrap \
  --body '{"admin_email":"you@example.com","app_name":"SkMeld","seed_demo_data":true}'
```

Your app is live at `https://<subdomain>.run402.com`.

See [docs/setup.md](docs/setup.md) for detailed instructions.

## Customization

Everything is configurable via SQL — no code changes needed:

- **Branding**: app name, company, logo, theme color, support contact
- **Terminology**: rename Resident→Member, Unit→Home, etc. via `ui_labels`
- **Categories**: add/remove issue types with icons and hints
- **Priorities**: adjust SLA response/resolution hours
- **Statuses**: rename labels, reorder board columns
- **Transitions**: control which roles can move between statuses

See [docs/customization.md](docs/customization.md) for examples.

## Fork Prompts

Ready-made prompts for customizing SkMeld for different verticals:

- **HOA** — common-area tracker for homeowner associations
- **Office** — facilities request tracker for office managers
- **Church** — building maintenance for houses of worship
- **Coworking** — member issue tracker for coworking spaces

See [docs/fork-prompts.md](docs/fork-prompts.md).

## Tech Stack

- **Backend**: Run402 (Postgres + PostgREST + Lambda functions + S3 storage)
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Auth**: Run402 JWT auth with app-level role from profiles table
- **Board**: dnd-kit for accessible drag/drop
- **Data fetching**: TanStack Query with polling

## License

MIT — see [LICENSE](LICENSE).
