# xFocus — Setup Guide

## Prerequisites
- Docker Desktop running
- Local Supabase already started (from xPM: `cd ~/Documents/edgex-pm && supabase start`)

## 1. Get your local Supabase anon key

```bash
cd ~/Documents/edgex-pm
supabase status
```

Copy the `anon key` value.

## 2. Configure xFocus

```bash
cd ~/Documents/edgex-focus
cp .env.local .env.local.bak   # already exists, just update it
```

Edit `.env.local` and paste your anon key:
```
VITE_SUPABASE_ANON_KEY=eyJhbGciO...your-key-here
```

## 3. Apply the DB migration

```bash
cd ~/Documents/edgex-pm
supabase migration up
```

This creates: `focus_sessions`, `time_blocks`, `intentions`, `distractions` tables.

## 4. Start xFocus

```bash
cd ~/Documents/edgex-focus
npm run dev
```

Open http://localhost:5173 — sign in with your EDGEx account (same as xPM).

## 5. Install as PWA

Once running in Chrome/Edge:
- Click the install icon in the address bar, or
- Open DevTools → Application → Manifest → Install

## Migration file location
`supabase/migrations/20260605000001_xfocus_schema.sql`

Copy this file into `~/Documents/edgex-pm/supabase/migrations/` before running `supabase migration up`.

## Pulse task integration
xFocus reads from the shared `tasks` table. If Pulse hasn't been built yet, the task panel will show "Pulse tables not found" — everything else works fine without it.
