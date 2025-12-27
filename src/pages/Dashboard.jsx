import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({
    teachingSkills: 0,
    learningSkills: 0,
    activeSwaps: 0,
    completedSwaps: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = useCallback(async () => {
    if (!profile?.id) {
      setLoading(false)
      return
    }

    try {
      const { data: skills, error: skillsError } = await supabase
        .from('user_skills')
        .select('role')
        .eq('user_id', profile.id)
        .eq('is_active', true)

      if (skillsError) throw skillsError

      const teachingCount = skills?.filter(s => s.role === 'teach').length || 0
      const learningCount = skills?.filter(s => s.role === 'learn').length || 0

      const { data: swaps, error: swapsError} = await supabase
        .from('swap_participants')
        .select('swap_id, swaps(status)')
        .eq('user_id', profile.id)

      if (swapsError) throw swapsError

      const activeCount = swaps?.filter(s => 
        ['proposed', 'accepted', 'active'].includes(s.swaps?.status)
      ).length || 0

      const completedCount = swaps?.filter(s => 
        s.swaps?.status === 'completed'
      ).length || 0

      setStats({
        teachingSkills: teachingCount,
        learningSkills: learningCount,
        activeSwaps: activeCount,
        completedSwaps: completedCount,
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [profile?.id])

  useEffect(() => {
    console.log('Dashboard: profile =', profile)
    if (profile?.id) {
      fetchDashboardData()
    } else {
      console.log('Dashboard: No profile yet, setting loading false')
      setLoading(false)
    }
  }, [profile, fetchDashboardData])

  // Listen for session refresh event from AuthContext
  useEffect(() => {
    const handleSessionRefreshed = () => {
      if (profile?.id) {
        console.log('Dashboard: Session refreshed, updating data...')
        fetchDashboardData()
      }
    }

    const handleSessionExpired = () => {
      console.log('Dashboard: Session expired')
      setStats({
        teachingSkills: 0,
        learningSkills: 0,
        activeSwaps: 0,
        completedSwaps: 0,
      })
    }

    window.addEventListener('session-refreshed', handleSessionRefreshed)
    window.addEventListener('session-expired', handleSessionExpired)
    
    return () => {
      window.removeEventListener('session-refreshed', handleSessionRefreshed)
      window.removeEventListener('session-expired', handleSessionExpired)
    }
  }, [profile?.id, fetchDashboardData])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="card-glass border-primary-800/30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-gradient mb-2">
              Welcome back, {profile?.full_name || 'there'}
            </h1>
            <p className="text-dark-400">
              Ready to exchange skills and grow together?
            </p>
          </div>
          <div className="hidden md:block w-16 h-16 rounded-full bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center shadow-glow">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Teaching Skills */}
        <Link to="/skills" className="stat-card group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary-950/30 border border-primary-800/50 flex items-center justify-center group-hover:shadow-glow transition-all duration-300">
              <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <div className="stat-label">Teaching Skills</div>
          <div className="stat-value">{stats.teachingSkills}</div>
          <div className="mt-3 text-sm text-primary-400 flex items-center gap-1 group-hover:gap-2 transition-all">
            Manage skills
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        {/* Learning Skills */}
        <Link to="/skills" className="stat-card group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-accent-950/30 border border-accent-800/50 flex items-center justify-center group-hover:shadow-glow transition-all duration-300">
              <svg className="w-6 h-6 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
          <div className="stat-label">Learning Skills</div>
          <div className="stat-value">{stats.learningSkills}</div>
          <div className="mt-3 text-sm text-accent-400 flex items-center gap-1 group-hover:gap-2 transition-all">
            Add more
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        {/* Active Swaps */}
        <Link to="/my-swaps" className="stat-card group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-success-950/30 border border-success-800/50 flex items-center justify-center group-hover:shadow-glow transition-all duration-300">
              <svg className="w-6 h-6 text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
          </div>
          <div className="stat-label">Active Swaps</div>
          <div className="stat-value">{stats.activeSwaps}</div>
          <div className="mt-3 text-sm text-success-400 flex items-center gap-1 group-hover:gap-2 transition-all">
            View swaps
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        {/* Reputation */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-warning-950/30 border border-warning-800/50 flex items-center justify-center">
              <svg className="w-6 h-6 text-warning-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
          <div className="stat-label">Reputation Score</div>
          <div className="stat-value">{profile?.reputation_score?.toFixed(1) || '50.0'}</div>
          <div className="mt-3 text-xs text-dark-500">
            Based on {stats.completedSwaps} completed {stats.completedSwaps === 1 ? 'swap' : 'swaps'}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="section-title mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/skills?action=add" className="card-hover p-6 border-2 border-dark-800 group">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center mb-4 shadow-lg group-hover:shadow-glow transition-all duration-300">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="font-semibold text-dark-100 text-lg mb-2">Add a Skill</h3>
            <p className="text-sm text-dark-400">
              List what you can teach or want to learn
            </p>
          </Link>

          <Link to="/find-swaps" className="card-hover p-6 border-2 border-dark-800 group">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-600 to-accent-500 flex items-center justify-center mb-4 shadow-lg group-hover:shadow-glow transition-all duration-300">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-dark-100 text-lg mb-2">Find Swaps</h3>
            <p className="text-sm text-dark-400">
              Discover fair skill exchange matches
            </p>
          </Link>

          <Link to="/profile" className="card-hover p-6 border-2 border-dark-800 group">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-success-600 to-success-500 flex items-center justify-center mb-4 shadow-lg group-hover:shadow-glow transition-all duration-300">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-dark-100 text-lg mb-2">Update Profile</h3>
            <p className="text-sm text-dark-400">
              Complete your profile to improve matches
            </p>
          </Link>
        </div>
      </div>

      {/* Getting Started Guide */}
      {stats.teachingSkills === 0 && stats.learningSkills === 0 && (
        <div className="card border-primary-800/30 bg-gradient-to-br from-primary-950/20 to-accent-950/20">
          <h2 className="section-title mb-6">Getting Started with SkillSwap</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-dark-900/50 border border-dark-800">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center text-white font-bold shadow-lg">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-dark-100 mb-1">Add Your Skills</h3>
                <p className="text-sm text-dark-400">
                  List skills you can teach and skills you want to learn. Use AI assessment for accurate skill levels.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-dark-900/50 border border-dark-800">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-accent-600 to-accent-500 flex items-center justify-center text-white font-bold shadow-lg">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-dark-100 mb-1">Find Fair Matches</h3>
                <p className="text-sm text-dark-400">
                  Our algorithm finds balanced exchanges based on skill difficulty, demand, and your availability.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-dark-900/50 border border-dark-800">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-success-600 to-success-500 flex items-center justify-center text-white font-bold shadow-lg">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-dark-100 mb-1">Start Learning & Teaching</h3>
                <p className="text-sm text-dark-400">
                  Accept a swap proposal and start exchanging skills. Build your reputation through completed swaps.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
