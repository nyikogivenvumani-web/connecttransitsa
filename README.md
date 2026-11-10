# ConnectTransit SA

South African commuter incident reporting platform.

## Stack

- **Commuter app:** React Native + Expo (SDK 58), Expo Router, NativeWind
- **Web portals:** Next.js 16 (App Router), Tailwind CSS v4
- **Backend:** Supabase (PostgreSQL 15, Auth, Storage, Edge Functions)

## Prerequisites

- Node.js 24 LTS
- Docker Desktop (running) — required for local Supabase
- Android Studio with one Android emulator
- Maestro CLI (`brew install maestro` or see https://maestro.mobile.dev)
- Playwright browsers: `npx playwright install`

## Setup

1. Clone the repo and copy the env file:
```sh
cp .env.example .env
# Fill in the values from `npx supabase status` after starting the backend
```

2. Install dependencies:
```sh
npm install
cd mobile && npm install && cd ..
cd web && npm install && cd ..
```

3. Start the local backend:
```sh
npx supabase start
npx supabase db reset   # runs migrations + seed
```

4. Fill `.env` with the URLs and keys printed by `npx supabase status`.

5. Serve Edge Functions:
```sh
npx supabase functions serve --env-file supabase/.env.local
```

## Running the apps

```sh
cd mobile && npx expo start          # commuter app
cd web && npm run dev                # web portals (http://localhost:3000)
```

## Tests

| Command | What it runs |
|---------|-------------|
| `cd mobile && npm test` | Unit + component tests (Jest + RNTL) |
| `cd web && npm test` | Unit + component tests (Jest + RTL) |
| `npx supabase test db` | Database + RLS tests (pgTAP) |
| `npm run test:integration` | Integration tests against local Supabase |
| `maestro test mobile/.maestro/` | Mobile E2E (needs emulator + dev build) |
| `cd web && npx playwright test` | Web E2E |
| `npm run check` | Full check: lint + typecheck + all unit/component/db/integration tests |

## Test accounts (after seed)

`supabase db reset` creates the accounts with unusable passwords. Set real ones with the seed script
(needs `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `SEED_TEST_PASSWORD` in the root `.env`):

```sh
npx supabase db reset
npx tsx --env-file=.env scripts/seed-storage.mts
```

| Role | Email | Password |
|------|-------|----------|
| Commuter | thabo@example.co.za | `$SEED_TEST_PASSWORD` |
| Commuter | lerato@example.co.za | `$SEED_TEST_PASSWORD` |
| Transport Admin (DORLJOTA) | sipho@example.co.za | `$SEED_TEST_PASSWORD` |
| Transport Admin (Metrobus) | nomsa@example.co.za | `$SEED_TEST_PASSWORD` |
| SAPS | saps.dispatch@example.co.za | `$SEED_TEST_PASSWORD` |
| System Admin | sysadmin@example.co.za | `$SEED_TEST_PASSWORD` |
