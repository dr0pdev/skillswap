import { createClient } from '@supabase/supabase-js'

// Support both VITE_SUPABASE_ANON_KEY and VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => {
  const hasUrl = supabaseUrl && 
                 supabaseUrl !== 'your-project-url' &&
                 typeof supabaseUrl === 'string' &&
                 supabaseUrl.trim() !== '' &&
                 supabaseUrl.includes('supabase.co')
                 
  const hasKey = supabaseAnonKey && 
                 supabaseAnonKey !== 'your-anon-key' &&
                 typeof supabaseAnonKey === 'string' &&
                 supabaseAnonKey.trim() !== ''
  
  return hasUrl && hasKey
}

// Create client - use try-catch to handle any initialization errors
let client

try {
  if (isSupabaseConfigured()) {
    client = createClient(supabaseUrl, supabaseAnonKey)
  } else {
    // Provide minimal valid inputs to prevent errors
    // These won't work but will allow the app to run
    client = createClient(
      'https://xxxxx.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    )
  }
} catch (error) {
  console.warn('Supabase client initialization failed:', error)
  // Create a minimal mock client to prevent app crashes
  client = createClient('https://xxxxx.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0')
}

export const supabase = client

