import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import './App.css'

function App() {
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    // Check if Supabase is configured
    const checkConnection = async () => {
      const configured = isSupabaseConfigured()
      
      // Debug logging (remove in production)
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Not set')
      console.log('Supabase Key:', (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY) ? 'Set' : 'Not set')
      console.log('Is configured:', configured)
      
      if (configured) {
        // Try a simple connection test
        try {
          // Just check if we can access the Supabase instance
          // This won't fail even if tables don't exist
          await supabase.auth.getSession()
          setConnected(true)
        } catch (err) {
          console.warn('Supabase connection test failed:', err)
          // If configured but connection fails, still show as configured
          // (might be network issue or wrong credentials)
          setConnected(true)
        }
      } else {
        setConnected(false)
      }
      
      setLoading(false)
    }

    checkConnection()
  }, [])

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="card">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>React + Supabase</h1>
        <div className="card">
          <p>
            {connected ? (
              <span style={{ color: 'green' }}>✓ Supabase configured</span>
            ) : (
              <span style={{ color: 'orange' }}>
              ⚠ Please configure your Supabase credentials in <code>.env</code>
            </span>
            )}
          </p>
          <p>
            Edit <code>src/App.jsx</code> to start building your app
          </p>
          <p className="read-the-docs">
            Supabase client is available via: <code>import {'{'} supabase {'}'} from './lib/supabase'</code>
          </p>
        </div>
      </div>
    </>
  )
}

export default App
