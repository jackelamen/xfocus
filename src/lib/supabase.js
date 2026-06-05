import { createClient } from '@supabase/supabase-js'

// Supabase project — MUST match Pulse so xFocus reads the same tasks/sessions
// under the same login (same project = same user UIDs). Pulse uses the cloud
// project mdkyijbgvxedelcqcouu. URL/key are env-driven (.env.local locally,
// Vercel env vars in production), defaulting the URL to the cloud project.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://mdkyijbgvxedelcqcouu.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Surfaced so the app can show a clear message instead of a blank screen when
// env vars weren't set on the host (the classic Vercel "white screen" cause).
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY || 'missing-anon-key',
  {
    auth: {
      persistSession: true,
      storageKey: 'xfocus-auth',
      storage: localStorage,
    },
  }
)
