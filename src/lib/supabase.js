import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Create client with empty strings if env vars are missing (will show warning in UI)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabaseUrl && 
         supabaseAnonKey && 
         supabaseUrl !== 'your-project-url' && 
         supabaseAnonKey !== 'your-anon-key'
}

