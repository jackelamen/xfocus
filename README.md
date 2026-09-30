# xFocus

Deep-work timer and time blocking, backed by Supabase and fed by Pulse tasks.

## Setup
1. `npm install`
2. `cp .env.example .env.local` and fill in `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
   (optionally `VITE_PULSE_URL`).
3. Apply migrations in `supabase/migrations`.
4. `npm run dev`

## Scripts
- `npm run dev` / `npm run build` / `npm run preview`
- `npm run lint`
- `npm test` (Vitest, pure helpers in `src/lib`)

See `SETUP.md` for the local EDGEx Supabase workflow.
