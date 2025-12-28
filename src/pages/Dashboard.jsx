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
      <div>
        <h1 className="text-3xl font-bold text-[#0C243D] mt-1">Dashboard</h1>
        <p className="text-[#0C243D] mt-1">Welcome back! Here's your overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
        {/* Active Swaps */}
        <Link to="/my-swaps" className="group relative overflow-hidden rounded-xl p-6 border border-indigo-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(99, 102, 241, 0.15) 100%)' }}>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-semibold text-[#0C243D] mt-1 uppercase tracking-wider">Active Swaps</div>
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-3">{stats.activeSwaps}</div>
            {/* Line Graph */}
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>
        </Link>

        {/* Skills Listed */}
        <Link to="/skills" className="group relative overflow-hidden rounded-xl p-6 border border-emerald-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.15) 100%)' }}>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-semibold text-[#0C243D] mt-1 uppercase tracking-wider">Skills Listed</div>
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-3">{stats.teachingSkills + stats.learningSkills}</div>
            {/* Line Graph */}
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>
        </Link>

        {/* Pending Requests */}
        <Link to="/my-swaps" className="group relative overflow-hidden rounded-xl p-6 border border-amber-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.15) 100%)' }}>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-semibold text-[#0C243D] mt-1 uppercase tracking-wider">Pending Requests</div>
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-3">1</div>
            {/* Line Graph */}
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full" style={{ width: '25%' }}></div>
            </div>
          </div>
        </Link>

        {/* Total Requests */}
        <Link to="/my-swaps" className="group relative overflow-hidden rounded-xl p-6 border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.15) 100%)' }}>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-semibold text-[#0C243D] mt-1 uppercase tracking-wider">Total Requests</div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-3">4</div>
            {/* Line Graph */}
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full" style={{ width: '60%' }}></div>
            </div>
          </div>
        </Link>

        {/* Reputation Score */}
        <div className="group relative overflow-hidden rounded-xl p-6 border border-purple-200/50 shadow-lg" style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(147, 51, 234, 0.15) 100%)' }}>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-semibold text-[#0C243D] mt-1 uppercase tracking-wider">Reputation Score</div>
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{profile?.reputation_score?.toFixed(1) || '4.8'}</div>
            <div className="text-xs text-gray-500 mb-3">Based on {stats.completedSwaps} completed {stats.completedSwaps === 1 ? 'swap' : 'swaps'}</div>
            {/* Line Graph */}
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-pink-600 rounded-full" style={{ width: '96%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-gray-200 shadow-lg p-6" style={{ backgroundColor: '#F5F7FA' }}>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/skills?action=add" className="group relative overflow-hidden rounded-xl p-6 border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1" style={{ backgroundColor: '#F5F7FA' }}>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900 text-lg mb-2">Add a Skill</h3>
            <p className="text-sm text-gray-600">
              List what you can teach or want to learn
            </p>
          </Link>

          <Link to="/find-swaps" className="group relative overflow-hidden rounded-xl p-6 border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1" style={{ backgroundColor: '#F5F7FA' }}>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900 text-lg mb-2">Find Swaps</h3>
            <p className="text-sm text-gray-600">
              Discover fair skill exchange matches
            </p>
          </Link>

          <Link to="/profile" className="group relative overflow-hidden rounded-xl p-6 border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1" style={{ backgroundColor: '#F5F7FA' }}>
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900 text-lg mb-2">Update Profile</h3>
            <p className="text-sm text-gray-600">
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
