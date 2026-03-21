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

## Quick Start

```bash
cd apps/skmeld
npm install
npx tsx deploy.ts
```

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
