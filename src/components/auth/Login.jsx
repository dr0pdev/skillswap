import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const hasNavigated = useRef(false)
  const navigationTimeoutRef = useRef(null)

  // Listen for auth state changes directly
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user && !hasNavigated.current) {
          console.log('Auth state changed to SIGNED_IN, navigating...')
          hasNavigated.current = true
          // Clear any pending timeout
          if (navigationTimeoutRef.current) {
            clearTimeout(navigationTimeoutRef.current)
          }
          // Use window.location for reliable navigation that bypasses ProtectedRoute timing issues
          window.location.href = '/dashboard'
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current)
      }
    }
  }, [])

  // Redirect to dashboard when user is authenticated (backup)
  useEffect(() => {
    if (user && !authLoading && !hasNavigated.current) {
      console.log('User authenticated, redirecting to dashboard...', { userId: user.id })
      hasNavigated.current = true
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current)
      }
      // Use window.location for reliable navigation
      window.location.href = '/dashboard'
    }
  }, [user, authLoading])

  // Reset navigation flag when user logs out
  useEffect(() => {
    if (!user && !authLoading) {
      hasNavigated.current = false
    }
  }, [user, authLoading])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    hasNavigated.current = false

    console.log('Attempting login for:', email)
    const { data, error: signInError } = await signIn({ email, password })

    if (signInError) {
      console.error('Login error:', signInError)
      setError(signInError.message)
      setLoading(false)
    } else {
      console.log('Login successful:', data)
      setLoading(false)
      
      // Navigation will be handled by the auth state change listener
      // which uses window.location.href for reliable navigation
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-primary-950 to-dark-950">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxZjJhMzciIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzBoLTJWMGgydjMwem0wIDMwdi0yaC0ydjJoMnptMC0zMGgtMnYyaDJ2LTJ6bTAtMzBoMnYyaC0yVjB6bS0yIDMwaDJ2LTJoLTJ2MnptMiAzMGgtMnYtMmgydjJ6bS0yLTMwaDJ2MmgtMnYtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10"></div>
      </div>

      {/* Content */}
      <div className="max-w-md w-full relative z-10 animate-fade-in">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-accent-600 shadow-2xl shadow-primary-900/50 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent mb-2">
            Skill Swap
          </h1>
          <p className="text-dark-400">Fair and transparent skill exchanges</p>
        </div>

        {/* Login Card */}
        <div className="modal-content">
          <h2 className="text-2xl font-bold text-dark-100 mb-6">Welcome Back</h2>

          {error && (
            <div className="bg-error-950/20 border border-error-800/50 text-error-200 px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="spinner-small"></div>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign In
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-dark-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-primary-400 text-2xl font-bold">100%</div>
            <div className="text-dark-500 text-xs mt-1">Fair Trades</div>
          </div>
          <div>
            <div className="text-accent-400 text-2xl font-bold">AI</div>
            <div className="text-dark-500 text-xs mt-1">Powered</div>
          </div>
          <div>
            <div className="text-success-400 text-2xl font-bold">Free</div>
            <div className="text-dark-500 text-xs mt-1">Forever</div>
          </div>
        </div>
      </div>
    </div>
  )
}
