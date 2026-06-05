import { createClient } from '@supabase/supabase-js'

// Supabase project — MUST match Pulse so xFocus reads the same tasks under the
// same login (same project = same user UIDs). Pulse uses the cloud project
// mdkyijbgvxedelcqcouu. URL/key are env-driven so you can point at local or
// cloud via .env.local, but default to the cloud project Pulse uses.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://mdkyijbgvxedelcqcouu.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    storageKey: 'xfocus-auth',
    storage: localStorage,
  },
})
