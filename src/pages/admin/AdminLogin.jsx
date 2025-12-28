import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      // Check if user has admin role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', authData.user.id)
        .single()

      if (userError) throw userError

      if (userData.role !== 'admin') {
        // Not an admin, sign them out
        await supabase.auth.signOut()
        throw new Error('Access denied. Admin credentials required.')
      }

      // Success - redirect to admin dashboard
      navigate('/admin/dashboard')
    } catch (err) {
      console.error('Admin login error:', err)
      setError(err.message || 'Invalid admin credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-900/50">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-display font-bold text-gradient mb-2">
            Admin Portal
          </h1>
          <p className="text-dark-400">
            Sign in to access the admin dashboard
          </p>
        </div>

        {/* Login Form */}
        <div className="card-glass">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-error-950/30 border border-error-800/50 text-error-300 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <div>
              <label className="label">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="admin@skillswap.com"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="spinner-small"></div>
                  Signing in...
                </span>
              ) : (
                'Sign In as Admin'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-dark-900 text-dark-400">or</span>
            </div>
          </div>

          {/* Back to User Login */}
          <Link
            to="/login"
            className="block text-center text-dark-400 hover:text-primary-400 transition-colors"
          >
            Back to User Login
          </Link>
        </div>

        {/* Security Notice */}
        <div className="mt-6 card-glass border-warning-800/30">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-warning-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div className="text-sm">
              <p className="text-warning-400 font-medium mb-1">Admin Access Only</p>
              <p className="text-dark-400 mb-2">
                Admin accounts can only be created by database administrators. If you need admin access, contact your system administrator.
              </p>
              <div className="bg-dark-950/50 rounded p-2 border border-dark-700">
                <p className="text-dark-400 text-xs">
                  <span className="text-dark-500">Demo:</span> admin@skillswap.com / Admin@123456
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

