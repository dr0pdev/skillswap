import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { SKILL_CATEGORIES, SKILL_ROLES } from '../utils/constants'
import { fetchActiveSwaps, filterActiveSkills } from '../utils/activeSwaps'
import { getSkillsCapacity } from '../utils/capacity'

export default function Browse() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [skills, setSkills] = useState([])
  const [filteredSkills, setFilteredSkills] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [activeTab, setActiveTab] = useState(SKILL_ROLES.TEACH)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [activeLearnSkillIds, setActiveLearnSkillIds] = useState([]) // Skills already being learned
  const [activeSwapsMap, setActiveSwapsMap] = useState({}) // Map of skill_id -> swap_id
  const [skillsCapacity, setSkillsCapacity] = useState({}) // Capacity info for skills

  const categories = ['all', ...SKILL_CATEGORIES]

  useEffect(() => {
    let cancelled = false

    const fetchSkills = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        console.log('Browse: Fetching', activeTab, 'skills')

        // Fetch active swaps to exclude skills already being learned
        const { activeLearnSkillIds: activeIds, activeSwaps } = await fetchActiveSwaps(user.id)
        setActiveLearnSkillIds(activeIds)
        
        // Build map of skill_id -> swap_id for "View Active Swap" links
        const swapMap = {}
        activeSwaps.forEach(swap => {
          if (swap.learning_skill_id) {
            swapMap[swap.learning_skill_id] = swap.swap_id
          }
        })
        setActiveSwapsMap(swapMap)

        const { data, error } = await supabase
          .from('user_skills')
          .select(`
            *,
            skills (
              id,
              name,
              category,
              demand_score,
              base_difficulty
            ),
            users (
              id,
              full_name,
              reputation_score
            )
          `)
          .eq('role', activeTab)
          .eq('is_active', true)
          .neq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (cancelled) return

        if (error) {
          console.error('Browse error:', error)
          setSkills([])
          setFilteredSkills([])
        } else {
          console.log('Browse: Found', data?.length || 0, 'skills before filtering')
          
          let filteredData = data || []

          // If Learning tab, filter out skills where the owner is already actively learning them
          if (activeTab === SKILL_ROLES.LEARN && filteredData.length > 0) {
            // Fetch active swaps for all users who posted learning requests
            const userIds = [...new Set(filteredData.map(skill => skill.user_id))]
            
            // For each user, check their active swaps
            const usersActiveSkills = new Map()
            
            for (const userId of userIds) {
              const { activeLearnSkillIds: theirActiveSkills } = await fetchActiveSwaps(userId)
              usersActiveSkills.set(userId, theirActiveSkills)
            }

            // Filter out learning requests where the user is already actively learning that skill
            filteredData = filteredData.filter(skill => {
              const skillId = skill.skill_id || skill.skills?.id
              const theirActiveSkills = usersActiveSkills.get(skill.user_id) || []
              return !theirActiveSkills.includes(skillId)
            })

            console.log('Browse: After filtering active learners:', filteredData.length, 'skills')
          }

          setSkills(filteredData)
          setFilteredSkills(filteredData)

          // Fetch capacity info for teaching tab
          if (activeTab === SKILL_ROLES.TEACH && filteredData.length > 0) {
            // Get unique user IDs
            const userIds = [...new Set(filteredData.map(skill => skill.user_id))]
            const capacityMap = {}

            // For each user's skills, get capacity
            for (const userId of userIds) {
              const userSkills = filteredData.filter(s => s.user_id === userId)
              const capacity = await getSkillsCapacity(userId, userSkills, 'teach')
              Object.assign(capacityMap, capacity)
            }

            setSkillsCapacity(capacityMap)
          }
        }
      } catch (error) {
        console.error('Browse failed:', error)
        if (!cancelled) {
          setSkills([])
          setFilteredSkills([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchSkills()

    return () => {
      cancelled = true
    }
  }, [user?.id, activeTab, refreshTrigger])

  // Listen for session refresh event from AuthContext
  useEffect(() => {
    const handleSessionRefreshed = () => {
      if (user?.id) {
        console.log('Browse: Session refreshed, updating data...')
        setRefreshTrigger((prev) => prev + 1)
      }
    }

    const handleSessionExpired = () => {
      console.log('Browse: Session expired')
      setSkills([])
      setFilteredSkills([])
    }

    window.addEventListener('session-refreshed', handleSessionRefreshed)
    window.addEventListener('session-expired', handleSessionExpired)
    
    return () => {
      window.removeEventListener('session-refreshed', handleSessionRefreshed)
      window.removeEventListener('session-expired', handleSessionExpired)
    }
  }, [user?.id])

  useEffect(() => {
    let filtered = [...skills]

    if (searchQuery.trim()) {
      filtered = filtered.filter((skill) =>
        skill.skills.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        (skill) =>
          skill.skills.category.toLowerCase() === selectedCategory.toLowerCase()
      )
    }

    setFilteredSkills(filtered)
  }, [skills, searchQuery, selectedCategory])

  const handleRequestToLearn = (skill) => {
    // Check if already learning this skill
    const skillId = skill.skill_id || skill.skills?.id
    if (activeLearnSkillIds.includes(skillId)) {
      // Redirect to active swap
      const swapId = activeSwapsMap[skillId]
      if (swapId) {
        navigate('/my-swaps', { state: { highlightSwapId: swapId } })
      } else {
        alert('You are already actively learning this skill.')
      }
      return
    }

    navigate('/propose-swap', { 
      state: { 
        targetSkill: skill,
        mode: 'request-to-learn' 
      } 
    })
  }

  const handleOfferToTeach = (skill) => {
    navigate('/propose-swap', { 
      state: { 
        targetSkill: skill,
        mode: 'offer-to-teach' 
      } 
    })
  }

  const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return 'badge-success'
      case 'intermediate':
        return 'badge-warning'
      case 'advanced':
        return 'badge-error'
      default:
        return 'badge-secondary'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="section-title">Browse Skills</h1>
        <p className="section-subtitle">
          Discover skills from the community — open and transparent
        </p>
      </div>

      {/* Search and Filters */}
      <div className="card space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by skill name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-12"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category.toLowerCase())}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                selectedCategory === category.toLowerCase()
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/50'
                  : 'bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-dark-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-dark-800">
        <button
          onClick={() => setActiveTab(SKILL_ROLES.TEACH)}
          className={`tab ${activeTab === SKILL_ROLES.TEACH ? 'tab-active' : ''}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span>Teaching ({skills.length})</span>
        </button>
        <button
          onClick={() => setActiveTab(SKILL_ROLES.LEARN)}
          className={`tab ${activeTab === SKILL_ROLES.LEARN ? 'tab-active' : ''}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span>Learning ({skills.length})</span>
        </button>
      </div>

      {/* Skills Grid */}
      {filteredSkills.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-20 h-20 rounded-full bg-dark-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-dark-100 mb-2">
            No skills found
          </h3>
          <p className="text-dark-400">
            {searchQuery || selectedCategory !== 'all'
              ? 'Try adjusting your search or filters'
              : `No one is ${
                  activeTab === SKILL_ROLES.TEACH ? 'teaching' : 'requesting'
                } skills yet`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSkills.map((skill) => (
            <div
              key={skill.id}
              className="card-hover"
            >
              {/* User Info */}
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-dark-800">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                  {skill.users.full_name?.charAt(0) || '?'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-dark-100">
                    {skill.users.full_name || 'Anonymous'}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-dark-400">
                    <svg className="w-4 h-4 text-warning-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>{skill.users.reputation_score?.toFixed(1) || '5.0'}</span>
                  </div>
                </div>
              </div>

              {/* Skill Details */}
              <h3 className="text-xl font-semibold text-dark-100 mb-3">
                {skill.skills.name}
              </h3>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`badge ${
                  activeTab === SKILL_ROLES.TEACH
                    ? 'badge-primary'
                    : 'bg-accent-900/30 text-accent-400 border-accent-800/50'
                }`}>
                  {activeTab === SKILL_ROLES.TEACH ? 'Teaching' : 'Learning'}
                </span>
                {skill.level && (
                  <span className={`badge ${getLevelColor(skill.level)}`}>
                    {skill.level}
                  </span>
                )}
                <span className="badge badge-secondary">
                  {skill.skills.category}
                </span>
              </div>

              {/* Stats */}
              {activeTab === SKILL_ROLES.TEACH && (
                <div className="space-y-2 mb-4 p-3 rounded-lg bg-dark-900/50 border border-dark-800">
                  {skill.difficulty_score && (
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-400">Difficulty:</span>
                      <span className="font-medium text-dark-200">
                        {skill.difficulty_score}/100
                      </span>
                    </div>
                  )}
                  {skill.weekly_hours_available > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-400">Available:</span>
                      <span className="font-medium text-dark-200">
                        {skill.weekly_hours_available}h/week
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* AI Assessment */}
              {skill.ai_suggested_level && skill.ai_explanation && (
                <div className="bg-primary-950/20 border border-primary-800/30 rounded-lg p-3 mb-4">
                  <p className="text-xs text-primary-400 font-medium mb-1 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI Assessment
                  </p>
                  <p className="text-xs text-dark-300 line-clamp-3">
                    {skill.ai_explanation}
                  </p>
                </div>
              )}

              {/* Notes */}
              {skill.notes && (
                <p className="text-sm text-dark-400 mb-4 line-clamp-2">
                  {skill.notes}
                </p>
              )}

              {/* Action Button */}
              {(() => {
                const skillId = skill.skill_id || skill.skills?.id
                const isAlreadyLearning = activeTab === SKILL_ROLES.TEACH && activeLearnSkillIds.includes(skillId)
                const capacity = skillsCapacity[skillId] || {}
                const isFullyBooked = activeTab === SKILL_ROLES.TEACH && capacity.isFullyBooked
                const isPartiallyBooked = activeTab === SKILL_ROLES.TEACH && capacity.isPartiallyBooked
                
                // Show capacity info for teaching tab
                if (activeTab === SKILL_ROLES.TEACH && (capacity.totalCapacity > 0)) {
                  return (
                    <div className="space-y-2">
                      {/* Capacity Display */}
                      <div className="text-sm text-dark-300 mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-dark-500">Available:</span>
                          <span className={`font-semibold ${
                            isFullyBooked ? 'text-error-400' : 
                            isPartiallyBooked ? 'text-warning-400' : 
                            'text-success-400'
                          }`}>
                            {capacity.remainingHours}h / {capacity.totalCapacity}h per week
                          </span>
                        </div>
                        {capacity.allocatedHours > 0 && (
                          <div className="w-full bg-dark-700 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                isFullyBooked ? 'bg-error-600' : 'bg-primary-600'
                              }`}
                              style={{ width: `${(capacity.allocatedHours / capacity.totalCapacity) * 100}%` }}
                            ></div>
                          </div>
                        )}
                      </div>

                      {/* Status Badges */}
                      <div className="flex flex-wrap gap-2 mb-2">
                        {isFullyBooked && (
                          <span className="badge badge-error text-[10px]">
                            Fully Booked
                          </span>
                        )}
                        {isPartiallyBooked && (
                          <span className="badge badge-warning text-[10px]">
                            Partially Booked
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {isAlreadyLearning ? (
                        <>
                          <div className="w-full px-4 py-2.5 bg-success-950/20 border border-success-700/50 rounded-lg text-center">
                            <span className="text-xs font-semibold text-success-400">✓ Already Learning</span>
                          </div>
                          <button
                            onClick={() => {
                              const swapId = activeSwapsMap[skillId]
                              navigate('/my-swaps', { state: { highlightSwapId: swapId } })
                            }}
                            className="btn btn-secondary w-full text-sm"
                          >
                            View Active Swap
                          </button>
                        </>
                      ) : isFullyBooked ? (
                        <>
                          <div className="w-full px-4 py-2.5 bg-error-950/20 border border-error-700/50 rounded-lg text-center">
                            <span className="text-xs font-semibold text-error-400">Fully Booked</span>
                          </div>
                          <button
                            onClick={() => {
                              // Open profile modal to see schedule
                              alert('View profile to see when they might be available')
                            }}
                            className="btn btn-secondary w-full text-sm"
                          >
                            View Profile
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleRequestToLearn(skill)}
                          className="btn btn-primary w-full"
                        >
                          Request to Learn
                          {isPartiallyBooked && (
                            <span className="ml-2 text-[10px] opacity-75">
                              ({capacity.remainingHours}h left)
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  )
                }
                
                // Default for learning tab or no capacity data
                if (isAlreadyLearning) {
                  return (
                    <div className="space-y-2">
                      <div className="w-full px-4 py-2.5 bg-success-950/20 border border-success-700/50 rounded-lg text-center">
                        <span className="text-xs font-semibold text-success-400">✓ Already Learning</span>
                      </div>
                      <button
                        onClick={() => {
                          const swapId = activeSwapsMap[skillId]
                          navigate('/my-swaps', { state: { highlightSwapId: swapId } })
                        }}
                        className="btn btn-secondary w-full text-sm"
                      >
                        View Active Swap
                      </button>
                    </div>
                  )
                }

                return (
                  <button
                    onClick={() =>
                      activeTab === SKILL_ROLES.TEACH
                        ? handleRequestToLearn(skill)
                        : handleOfferToTeach(skill)
                    }
                    className="btn btn-primary w-full"
                  >
                    {activeTab === SKILL_ROLES.TEACH ? 'Request to Learn' : 'Offer to Teach'}
                  </button>
                )
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
