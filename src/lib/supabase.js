import { createClient } from '@supabase/supabase-js'

// Local Supabase instance — same as xPM
const SUPABASE_URL = 'http://127.0.0.1:54321'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    storageKey: 'xfocus-auth',
    storage: localStorage,
  },
})
