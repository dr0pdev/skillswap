import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import MonthlyCalendar from '../calendar/MonthlyCalendar'
import { getSkillsCapacity } from '../../utils/capacity'

export default function UserProfileModal({ userId, onClose }) {
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState(null)
  const [teachingSkills, setTeachingSkills] = useState([])
  const [learningSkills, setLearningSkills] = useState([])
  const [teachingCapacity, setTeachingCapacity] = useState({})
  const [activeTab, setActiveTab] = useState('skills') // 'skills' or 'schedule'

  useEffect(() => {
    if (userId) {
      fetchUserProfile()
    }
  }, [userId])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError

      // Fetch user's skills
      const { data: skills, error: skillsError } = await supabase
        .from('user_skills')
        .select('*, skills(*)')
        .eq('user_id', userId)
        .eq('is_active', true)

      if (skillsError) throw skillsError

      const teaching = skills?.filter(s => s.role === 'teach') || []
      const learning = skills?.filter(s => s.role === 'learn') || []

      setUserData(profile)
      setTeachingSkills(teaching)
      setLearningSkills(learning)

      // Get capacity info for teaching skills
      const capacityInfo = await getSkillsCapacity(userId, teaching, 'teach')
      setTeachingCapacity(capacityInfo)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!userId) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-900 border border-dark-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-dark-900/95 backdrop-blur-sm border-b border-dark-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-2xl font-bold text-dark-100">User Profile</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-dark-800 hover:bg-dark-700 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-dark-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-dark-800 px-6 flex-shrink-0">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('skills')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'skills'
                  ? 'border-primary-600 text-primary-400'
                  : 'border-transparent text-dark-400 hover:text-dark-200'
              }`}
            >
              Skills & Info
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'schedule'
                  ? 'border-primary-600 text-primary-400'
                  : 'border-transparent text-dark-400 hover:text-dark-200'
              }`}
            >
              Schedule
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'skills' ? (
                <div className="space-y-6">
                  {/* User Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center text-white font-bold text-3xl shadow-xl flex-shrink-0">
                      {userData?.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-dark-100 mb-1">
                        {userData?.full_name || 'Anonymous User'}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-dark-400">
                        <svg className="w-4 h-4 text-warning-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="font-semibold">{userData?.reputation_score?.toFixed(1) || '50.0'}</span>
                        <span className="text-dark-500">•</span>
                        <span>{userData?.total_swaps_completed || 0} swaps completed</span>
                      </div>
                      {userData?.location && (
                        <div className="flex items-center gap-1 text-sm text-dark-400 mt-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          {userData.location}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  {userData?.bio && (
                    <div className="bg-dark-800/50 border border-dark-700 rounded-lg p-4">
                      <p className="text-dark-200 text-sm leading-relaxed">{userData.bio}</p>
                    </div>
                  )}

                  {/* Teaching Skills */}
                  {teachingSkills.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-dark-100 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        Teaching Skills
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {teachingSkills.map(skill => {
                          const skillId = skill.skill_id || skill.skills?.id
                          const capacity = teachingCapacity[skillId] || {}
                          const isFullyBooked = capacity.remainingHours === 0
                          const isPartiallyBooked = capacity.isPartiallyBooked

                          return (
                            <div key={skill.id} className="bg-dark-800/50 border border-dark-700 rounded-lg p-3">
                              <div className="flex items-start justify-between mb-2">
                                <p className="font-semibold text-dark-100 text-sm flex-1">
                                  {skill.skills?.name}
                                </p>
                                {isFullyBooked && (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-error-950/30 text-error-400 font-medium whitespace-nowrap ml-2">
                                    Fully Booked
                                  </span>
                                )}
                                {isPartiallyBooked && (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-warning-950/30 text-warning-400 font-medium whitespace-nowrap ml-2">
                                    Partially Booked
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-dark-400 mb-2">
                                <span className="badge badge-secondary">{skill.level}</span>
                                {skill.weekly_hours_available > 0 && (
                                  <span className="badge badge-secondary">
                                    {skill.weekly_hours_available}h/week total
                                  </span>
                                )}
                              </div>
                              {capacity.totalCapacity > 0 && (
                                <div className="text-xs">
                                  <div className="flex justify-between mb-1">
                                    <span className="text-dark-500">Available:</span>
                                    <span className={`font-semibold ${
                                      isFullyBooked ? 'text-error-400' : 'text-success-400'
                                    }`}>
                                      {capacity.remainingHours}h / {capacity.totalCapacity}h
                                    </span>
                                  </div>
                                  {capacity.allocatedHours > 0 && (
                                    <div className="w-full bg-dark-700 rounded-full h-1.5 mt-1">
                                      <div
                                        className="bg-primary-600 h-1.5 rounded-full transition-all"
                                        style={{ width: `${(capacity.allocatedHours / capacity.totalCapacity) * 100}%` }}
                                      ></div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Learning Skills */}
                  {learningSkills.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-dark-100 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Learning Goals
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {learningSkills.map(skill => (
                          <div key={skill.id} className="bg-dark-800/50 border border-dark-700 rounded-lg p-3">
                            <p className="font-semibold text-dark-100 text-sm mb-1">
                              {skill.skills?.name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-dark-400">
                              <span className="badge badge-secondary">{skill.level}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <MonthlyCalendar userId={userId} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

