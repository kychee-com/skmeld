# Setup Guide

## Prerequisites

- Node.js >= 20
- A Run402 account with an active tier (prototype is free)
- `BUYER_PRIVATE_KEY` in `.env` at the repo root

## One-Click Deploy

From the `apps/skmeld/` directory:

```bash
npm install
npx tsx deploy.ts
```

This will:
1. Subscribe to the prototype tier (free, testnet USDC)
2. Provision a new Run402 project
3. Build the React frontend
4. Deploy everything: schema, RLS, views, seed data, 7 functions, site, subdomain
5. Run the bootstrap function (creates admin user + demo data)
6. Print your credentials and URL

## Deploy with Publishing

To also publish the app to the Run402 marketplace:

```bash
npx tsx deploy.ts --publish
```

## Local Development

1. Start the Run402 local server (see main repo CLAUDE.md for instructions)
2. Create a `.env.local` in `apps/skmeld/`:
   ```
   VITE_API_BASE=http://localhost:4022
   VITE_ANON_KEY=<your project anon_key>
   ```
3. Run the dev server:
   ```bash
   npm run dev
   ```

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `BUYER_PRIVATE_KEY` | `.env` (repo root) | Wallet private key for x402 payments |
| `VITE_API_BASE` | `.env.local` (app) | Run402 API URL (default: https://api.run402.com) |
| `VITE_ANON_KEY` | `.env.local` (app) | Project anon key for PostgREST queries |

## After Deploy

1. Open `https://skmeld.run402.com` (or your chosen subdomain)
2. Log in with the admin credentials printed by the deploy script
3. Add your properties and spaces in the Properties page
4. Invite staff and residents in the People page
5. Residents can report issues; staff triage on the board
