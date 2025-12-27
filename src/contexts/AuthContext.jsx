import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const mounted = useRef(true)
  const profileCache = useRef(new Map())
  const visibilityDebounceRef = useRef(null)
  const fetchAbortControllerRef = useRef(null)

  // Memoized profile fetcher with caching and cancellation
  const fetchProfile = useCallback(async (userId, forceRefresh = false, signal = null) => {
    if (!userId) return null

    // Cancel previous request if exists
    if (fetchAbortControllerRef.current) {
      fetchAbortControllerRef.current.abort()
    }

    // Create new abort controller
    const abortController = new AbortController()
    fetchAbortControllerRef.current = abortController

    // Check cache first (unless force refresh)
    if (!forceRefresh && profileCache.current.has(userId)) {
      return profileCache.current.get(userId)
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
        .abortSignal(signal || abortController.signal)

      // Check if request was aborted
      if (abortController.signal.aborted) {
        return null
      }

      if (error) {
        console.error('Profile fetch error:', error.message)
        throw error
      }

      if (data) {
        profileCache.current.set(userId, data)
        return data
      }

      return null
    } catch (err) {
      // Ignore abort errors
      if (err.name === 'AbortError') {
        return null
      }
      console.error('Profile fetch failed:', err)
      throw err
    }
  }, [])

  // Retry wrapper for profile fetch
  const fetchProfileWithRetry = useCallback(async (userId, forceRefresh = false, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fetchProfile(userId, forceRefresh)
      } catch (err) {
        if (attempt === maxRetries) {
          throw err
        }
        // Exponential backoff: 500ms, 1000ms, 2000ms
        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt - 1)))
      }
    }
  }, [fetchProfile])

  // Initialize session on mount
  useEffect(() => {
    let isMounted = true
    const abortController = new AbortController()

    const initializeAuth = async () => {
      try {
        // Set timeout protection (30 seconds)
        const timeoutId = setTimeout(() => {
          if (isMounted) {
            setError('Session initialization timed out. Please refresh the page.')
            setLoading(false)
          }
        }, 30000)

        const { data: { session }, error } = await supabase.auth.getSession()
        
        clearTimeout(timeoutId)

        if (error) throw error

        if (isMounted && !abortController.signal.aborted) {
          if (session?.user) {
            console.log('Session restored:', session.user.email)
            setUser(session.user)
            
            const userProfile = await fetchProfileWithRetry(session.user.id, false)
            if (isMounted && !abortController.signal.aborted && userProfile) {
              setProfile(userProfile)
            }
          }
          setLoading(false)
        }
      } catch (err) {
        console.error('Session init error:', err)
        if (isMounted && !abortController.signal.aborted) {
          setError(err.message)
          setLoading(false)
        }
      }
    }

    initializeAuth()

    return () => {
      isMounted = false
      abortController.abort()
    }
  }, [fetchProfileWithRetry])

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event)

        switch (event) {
          case 'SIGNED_IN':
            if (mounted.current) {
              setUser(session?.user ?? null)
              if (session?.user) {
                try {
                  const userProfile = await fetchProfileWithRetry(session.user.id, true)
                  if (mounted.current && userProfile) {
                    setProfile(userProfile)
                  }
                } catch (err) {
                  console.error('Failed to fetch profile after sign in:', err)
                }
              }
              setLoading(false)
              setError(null)
            }
            break

          case 'SIGNED_OUT':
            if (mounted.current) {
              setUser(null)
              setProfile(null)
              profileCache.current.clear()
              setLoading(false)
              setError(null)
            }
            break

          case 'USER_UPDATED':
            if (mounted.current && session?.user) {
              setUser(session.user)
              try {
                const userProfile = await fetchProfileWithRetry(session.user.id, true)
                if (mounted.current && userProfile) {
                  setProfile(userProfile)
                }
              } catch (err) {
                console.error('Failed to fetch profile after user update:', err)
              }
            }
            break

          case 'TOKEN_REFRESHED':
            if (mounted.current && session?.user) {
              setUser(session.user)
            }
            break

          case 'PASSWORD_RECOVERY':
            // Handle password recovery if needed
            break

          default:
            break
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchProfileWithRetry])

  // Centralized visibility handler with debouncing
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') {
        return
      }

      // Clear any existing debounce timer
      if (visibilityDebounceRef.current) {
        clearTimeout(visibilityDebounceRef.current)
      }

      // Debounce: wait 500ms before checking session
      visibilityDebounceRef.current = setTimeout(async () => {
        if (!mounted.current || !user?.id) {
          return
        }

        console.log('Tab became visible, checking session...')
        
        try {
          // Check if session is still valid with timeout
          const sessionCheck = Promise.race([
            supabase.auth.getSession(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Session check timeout')), 10000)
            )
          ])

          const { data: { session }, error } = await sessionCheck
          
          if (error || !session) {
            console.log('Session invalid or expired')
            
            // Clear state
            if (mounted.current) {
              setUser(null)
              setProfile(null)
              profileCache.current.clear()
              setLoading(false)
            }

            // Dispatch custom event for pages to handle
            window.dispatchEvent(new CustomEvent('session-expired', {
              detail: { message: 'Your session has expired. Please log in again.' }
            }))
            
            // Redirect to login after a short delay to allow event propagation
            setTimeout(() => {
              window.location.href = '/login'
            }, 100)
            
            return
          }

          // Session is valid - refresh profile if needed
          if (session.user && mounted.current) {
            console.log('Session valid, refreshing profile')
            try {
              const userProfile = await fetchProfileWithRetry(session.user.id, true)
              if (mounted.current && userProfile) {
                setProfile(userProfile)
                // Dispatch event for pages to refresh their data
                window.dispatchEvent(new CustomEvent('session-refreshed'))
              }
            } catch (err) {
              console.error('Failed to refresh profile:', err)
              // Don't sign out on profile fetch failure, just log error
            }
          }
        } catch (err) {
          console.error('Visibility check error:', err)
          
          // If it's a timeout or network error, don't sign out
          // Just log and continue
          if (err.message.includes('timeout') || err.message.includes('network')) {
            console.log('Network issue detected, keeping session')
            return
          }

          // For other errors, check session one more time
          try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session && mounted.current) {
              setUser(null)
              setProfile(null)
              window.dispatchEvent(new CustomEvent('session-expired'))
              setTimeout(() => {
                window.location.href = '/login'
              }, 100)
            }
          } catch (checkErr) {
            console.error('Final session check failed:', checkErr)
          }
        }
      }, 500) // 500ms debounce
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (visibilityDebounceRef.current) {
        clearTimeout(visibilityDebounceRef.current)
      }
    }
  }, [user?.id, fetchProfileWithRetry])

  const signUp = async ({ email, password, fullName }) => {
    try {
      setError(null)
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (authError) throw authError

      return { data: authData, error: null }
    } catch (err) {
      console.error('SignUp error:', err)
      setError(err.message)
      return { data: null, error: err }
    }
  }

  const signIn = async ({ email, password }) => {
    try {
      setError(null)
      setLoading(true)
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      return { data, error: null }
    } catch (err) {
      console.error('SignIn error:', err)
      setError(err.message)
      return { data: null, error: err }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setError(null)
      
      // Cancel any pending requests
      if (fetchAbortControllerRef.current) {
        fetchAbortControllerRef.current.abort()
      }
      
      // Try to sign out with local scope first (no API call, just clears local session)
      // This avoids 403 errors if session is already invalid
      try {
        const { error: localSignOutError } = await supabase.auth.signOut({ scope: 'local' })
        // Ignore errors - we'll clear state anyway
        if (localSignOutError) {
          console.log('Local signOut had error (ignoring):', localSignOutError.message)
        }
      } catch (localErr) {
        // Silently ignore local signOut errors
        console.log('Local signOut failed (ignoring):', localErr.message)
      }
      
      // Always clear cache and state, regardless of API call result
      profileCache.current.clear()
      setUser(null)
      setProfile(null)
      
      // Clear localStorage session data manually as backup
      try {
        // Clear all Supabase-related auth keys
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('auth') || key.startsWith('sb-')) {
            localStorage.removeItem(key)
          }
        })
        // Also clear the specific key we use
        localStorage.removeItem('skillswap-auth')
      } catch (storageErr) {
        // Ignore storage errors
      }
      
      return { error: null }
    } catch (err) {
      // Even if signOut fails completely, clear local state
      console.log('SignOut error (clearing state anyway):', err.message)
      
      // Always clear state regardless of errors
      profileCache.current.clear()
      setUser(null)
      setProfile(null)
      
      // Clear localStorage as backup
      try {
        // Clear all Supabase-related auth keys
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('auth') || key.startsWith('sb-')) {
            localStorage.removeItem(key)
          }
        })
        // Also clear the specific key we use
        localStorage.removeItem('skillswap-auth')
      } catch (storageErr) {
        // Ignore storage errors
      }
      
      // Never set error for signOut - user should always be able to log out
      return { error: null } // Always return success since we cleared local state
    }
  }

  const updateProfile = async (updates) => {
    try {
      setError(null)
      
      if (!user?.id) {
        throw new Error('No user logged in')
      }

      const { data, error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (updateError) throw updateError
      
      // Update local state and cache
      if (mounted.current) {
        setProfile(data)
        profileCache.current.set(user.id, data)
      }
      
      return { data, error: null }
    } catch (err) {
      console.error('UpdateProfile error:', err)
      setError(err.message)
      return { data: null, error: err }
    }
  }

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const userProfile = await fetchProfileWithRetry(user.id, true)
      if (mounted.current && userProfile) {
        setProfile(userProfile)
      }
    } catch (err) {
      console.error('Refresh profile failed:', err)
      throw err
    }
  }, [user?.id, fetchProfileWithRetry])

  const clearError = () => setError(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mounted.current = false
      if (fetchAbortControllerRef.current) {
        fetchAbortControllerRef.current.abort()
      }
      if (visibilityDebounceRef.current) {
        clearTimeout(visibilityDebounceRef.current)
      }
    }
  }, [])

  const value = {
    user,
    profile,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
