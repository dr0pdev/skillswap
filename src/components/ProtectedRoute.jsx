import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const [checkingSession, setCheckingSession] = useState(true)
  const [hasValidSession, setHasValidSession] = useState(false)

  // Check session directly as fallback when user state hasn't updated yet
  useEffect(() => {
    const checkSession = async () => {
      if (!user && !loading) {
        // If no user in state, check session directly
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          console.log('ProtectedRoute: Found session, allowing access')
          setHasValidSession(true)
        } else {
          console.log('ProtectedRoute: No session found')
          setHasValidSession(false)
        }
      } else if (user) {
        setHasValidSession(true)
      }
      setCheckingSession(false)
    }

    checkSession()
  }, [user, loading])

  // Show loading while checking auth state
  if (loading || checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="text-center">
          <div className="spinner mx-auto"></div>
          <p className="mt-4 text-dark-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Allow access if user exists OR if we found a valid session
  if (!user && !hasValidSession) {
    return <Navigate to="/login" replace />
  }

  return children
}

