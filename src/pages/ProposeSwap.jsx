import { useState, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import SwapMatchCard from '../components/swaps/SwapMatchCard'
import AddSkillModal from '../components/skills/AddSkillModal'
import HoursAllocationForm from '../components/swaps/HoursAllocationForm'
import { checkDuplicateProposal } from '../utils/activeSwaps'
import { calculateRemainingHours } from '../utils/capacity'

export default function ProposeSwap() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  // Mode: 'learn' (lock learn skill) or 'teach' (lock teach skill)
  const [mode, setMode] = useState(null)
  
  // Locked skills based on mode
  const [learnSkill, setLearnSkill] = useState(null) // Locked in mode='learn'
  const [teachSkill, setTeachSkill] = useState(null) // Locked in mode='teach'
  const [otherUser, setOtherUser] = useState(null) // The other user
  
  // Variable skills (what cards vary by)
  const [myTeachingSkills, setMyTeachingSkills] = useState([]) // Used in mode='learn'
  const [myLearningSkills, setMyLearningSkills] = useState([]) // Used in mode='teach'
  const [theirTeachingSkills, setTheirTeachingSkills] = useState([]) // Used in mode='teach'
  const [theirLearningRequests, setTheirLearningRequests] = useState([]) // Used in mode='learn'
  
  // Hours and capacity
  const [proposedHours, setProposedHours] = useState(1)
  const [timePreferences, setTimePreferences] = useState({})
  const [teacherCapacity, setTeacherCapacity] = useState({})
  const [learnerCapacity, setLearnerCapacity] = useState({})
  const [selectedSwap, setSelectedSwap] = useState(null) // Currently selected swap for hours allocation
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showAddSkillModal, setShowAddSkillModal] = useState(false)
  const [customSkill, setCustomSkill] = useState(null)

  // Initialize from navigation state
  useEffect(() => {
    if (location.state) {
      const { targetSkill, mode: flowMode } = location.state
      
      if (flowMode === 'request-to-learn') {
        // Flow A: Browse Teaching → Request to Learn
        // Lock: You learn (targetSkill)
        // Vary: What you teach
        setMode('learn')
        setLearnSkill(targetSkill)
        setOtherUser(targetSkill.users || { id: targetSkill.user_id })
      } else if (flowMode === 'offer-to-teach') {
        // Flow B: Browse Learning → Offer to Teach
        // Lock: You teach (targetSkill - one of YOUR skills that matches what they want)
        // Vary: What you learn (from their teaching skills)
        setMode('teach')
        // Find the matching skill from my teaching skills
        // For now, we'll set it directly - will be refined in fetchData
        setTeachSkill(targetSkill)
        setOtherUser(targetSkill.users || { id: targetSkill.user_id })
      } else {
        navigate('/browse')
      }
    } else {
      navigate('/browse')
    }
  }, [location.state, navigate])

  // Fetch data based on mode
  useEffect(() => {
    if (user && mode && otherUser) {
      fetchData()
    }
  }, [user, mode, otherUser])

  const fetchData = async () => {
    try {
      setLoading(true)

      if (mode === 'learn') {
        // Mode: Learn (locked learn skill)
        // Fetch my teaching skills (what varies)
        const { data: mySkills, error: mySkillsError } = await supabase
          .from('user_skills')
          .select('*, skills(*)')
          .eq('user_id', user.id)
          .eq('role', 'teach')
          .eq('is_active', true)

        if (mySkillsError) throw mySkillsError
        setMyTeachingSkills(mySkills || [])

        // Fetch their learning requests (for match scoring)
        const theirUserId = learnSkill.user_id || otherUser?.id
        if (theirUserId) {
          const { data: theirSkills, error: theirSkillsError } = await supabase
            .from('user_skills')
            .select('*, skills(*)')
            .eq('user_id', theirUserId)
            .eq('role', 'learn')
            .eq('is_active', true)

          if (theirSkillsError) throw theirSkillsError
          setTheirLearningRequests(theirSkills || [])
        }
      } else if (mode === 'teach') {
        // Mode: Teach (locked teach skill)
        // First, fetch my teaching skills to verify and set the locked teachSkill
        const { data: mySkills, error: mySkillsError } = await supabase
          .from('user_skills')
          .select('*, skills(*)')
          .eq('user_id', user.id)
          .eq('role', 'teach')
          .eq('is_active', true)

        if (mySkillsError) throw mySkillsError
        
        // Find the skill that matches what they want to learn
        const theirRequestedSkillId = teachSkill?.skill_id || teachSkill?.skills?.id
        const matchingTeachSkill = mySkills?.find(
          s => s.skill_id === theirRequestedSkillId || s.skills?.id === theirRequestedSkillId
        )
        
        if (matchingTeachSkill) {
          setTeachSkill(matchingTeachSkill)
        }

        // Fetch my learning skills (what varies)
        const { data: myLearningSkillsData, error: myLearningError } = await supabase
          .from('user_skills')
          .select('*, skills(*)')
          .eq('user_id', user.id)
          .eq('role', 'learn')
          .eq('is_active', true)

        if (myLearningError) throw myLearningError
        setMyLearningSkills(myLearningSkillsData || [])

        // Fetch their teaching skills (for selecting what to learn)
        const theirUserId = otherUser?.id
        if (theirUserId) {
          const { data: theirTeachSkills, error: theirTeachError } = await supabase
            .from('user_skills')
            .select('*, skills(*)')
            .eq('user_id', theirUserId)
            .eq('role', 'teach')
            .eq('is_active', true)

          if (theirTeachError) throw theirTeachError
          setTheirTeachingSkills(theirTeachSkills || [])
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate match score
  const calculateMatchScore = (skillA, skillsListB) => {
    let score = 0

    const skillAName = skillA.skills?.name?.toLowerCase() || ''
    const skillACategory = skillA.skills?.category?.toLowerCase() || ''

    for (const skillB of skillsListB) {
      const skillBName = skillB.skills?.name?.toLowerCase() || ''
      const skillBCategory = skillB.skills?.category?.toLowerCase() || ''

      // Exact skill match: +70
      if (skillAName === skillBName) {
        score += 70
        break
      }

      // Same category match: +20
      if (skillACategory === skillBCategory && skillACategory !== '') {
        score += 20
      }

      // Level compatibility: +10
      const levelOrder = { beginner: 1, intermediate: 2, advanced: 3 }
      const levelA = levelOrder[skillA.level] || 0
      const levelB = levelOrder[skillB.level] || 0
      
      if (levelA >= levelB && levelA > 0) {
        score += 10
        break
      }
    }

    return Math.min(100, score)
  }

  // Generate swaps based on mode
  const possibleSwaps = useMemo(() => {
    if (!mode) return []

    const swaps = []

    if (mode === 'learn') {
      // Mode: Learn (locked learn skill)
      // Cards vary by: what I teach
      if (!learnSkill || !myTeachingSkills.length) return []

      myTeachingSkills.forEach(teachSkillOption => {
        // VALIDATION: Skip if teachSkill equals learnSkill
        const teachSkillId = teachSkillOption.skill_id || teachSkillOption.skills?.id
        const learnSkillId = learnSkill.skill_id || learnSkill.skills?.id
        const teachSkillName = teachSkillOption.skills?.name?.toLowerCase()
        const learnSkillName = learnSkill.skills?.name?.toLowerCase()

        if (teachSkillId === learnSkillId || teachSkillName === learnSkillName) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Invalid swap: teachSkill equals learnSkill', {
              teachSkill: teachSkillOption.skills?.name,
              learnSkill: learnSkill.skills?.name
            })
          }
          return
        }

        // Calculate match score
        const matchScore = calculateMatchScore(teachSkillOption, theirLearningRequests)

        if (matchScore >= 30) {
          swaps.push({
            teachSkill: teachSkillOption,
            learnSkill: learnSkill, // Always the same
            matchScore,
            isCustom: false
          })
        }
      })
    } else if (mode === 'teach') {
      // Mode: Teach (locked teach skill)
      // Cards vary by: what I learn (from their teaching skills that match my learning goals)
      if (!teachSkill || !theirTeachingSkills.length) return []

      theirTeachingSkills.forEach(learnSkillOption => {
        // VALIDATION: Skip if teachSkill equals learnSkill
        const teachSkillId = teachSkill.skill_id || teachSkill.skills?.id
        const learnSkillId = learnSkillOption.skill_id || learnSkillOption.skills?.id
        const teachSkillName = teachSkill.skills?.name?.toLowerCase()
        const learnSkillName = learnSkillOption.skills?.name?.toLowerCase()

        if (teachSkillId === learnSkillId || teachSkillName === learnSkillName) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Invalid swap: teachSkill equals learnSkill', {
              teachSkill: teachSkill.skills?.name,
              learnSkill: learnSkillOption.skills?.name
            })
          }
          return
        }

        // Calculate match score (how well their teaching matches my learning goals)
        const matchScore = calculateMatchScore(learnSkillOption, myLearningSkills)

        if (matchScore >= 30) {
          swaps.push({
            teachSkill: teachSkill, // Always the same
            learnSkill: learnSkillOption,
            matchScore,
            isCustom: false
          })
        }
      })
    }

    // Sort by highest score first
    swaps.sort((a, b) => b.matchScore - a.matchScore)
    return swaps
  }, [mode, myTeachingSkills, myLearningSkills, theirTeachingSkills, theirLearningRequests, learnSkill, teachSkill])

  // Handle skill added
  const handleSkillAdded = async () => {
    await fetchData()
    setShowAddSkillModal(false)
    
    const roleToFetch = mode === 'learn' ? 'teach' : 'learn'
    
    // Find the newly added skill
    const { data: recentSkills, error } = await supabase
      .from('user_skills')
      .select('*, skills(*)')
      .eq('user_id', user.id)
      .eq('role', roleToFetch)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (!error && recentSkills) {
      setCustomSkill(recentSkills)
    }
  }

  // Handle propose swap
  const handleProposeSwap = async (swap) => {
    // First, select the swap and show hours form
    setSelectedSwap(swap)
    
    // Fetch capacity for this specific swap
    try {
      const teachSkillId = swap.teachSkill.skill_id
      const learnSkillId = swap.learnSkill.skill_id
      const teacherUserId = mode === 'learn' ? user.id : otherUser.id
      const learnerUserId = mode === 'learn' ? otherUser.id : user.id

      const [teachCapacity, learnCapacity] = await Promise.all([
        calculateRemainingHours(teacherUserId, teachSkillId, 'teach'),
        calculateRemainingHours(learnerUserId, learnSkillId, 'learn')
      ])

      setTeacherCapacity(teachCapacity)
      setLearnerCapacity(learnCapacity)
      
      // Set initial hours to max available or 1, whichever is lower
      const maxHours = Math.min(teachCapacity.remainingHours || 1, learnCapacity.remainingHours || 1)
      setProposedHours(Math.min(1, maxHours))
    } catch (error) {
      console.error('Error fetching capacity:', error)
    }
  }

  const handleConfirmProposal = async () => {
    if (!selectedSwap || !selectedSwap.teachSkill || !selectedSwap.learnSkill) {
      alert('Invalid swap configuration')
      return
    }

    // Validation based on mode
    if (mode === 'learn') {
      const swapLearnSkillId = selectedSwap.learnSkill.skill_id || selectedSwap.learnSkill.skills?.id
      const lockedLearnSkillId = learnSkill.skill_id || learnSkill.skills?.id
      
      if (swapLearnSkillId !== lockedLearnSkillId) {
        console.error('CRITICAL: Swap learnSkill does not match locked learnSkill!')
        alert('Error: Learn skill mismatch. Please refresh and try again.')
        return
      }
    } else if (mode === 'teach') {
      const swapTeachSkillId = selectedSwap.teachSkill.skill_id || selectedSwap.teachSkill.skills?.id
      const lockedTeachSkillId = teachSkill.skill_id || teachSkill.skills?.id
      
      if (swapTeachSkillId !== lockedTeachSkillId) {
        console.error('CRITICAL: Swap teachSkill does not match locked teachSkill!')
        alert('Error: Teach skill mismatch. Please refresh and try again.')
        return
      }
    }

    // Validate hours
    const maxAvailable = Math.min(
      teacherCapacity.remainingHours || 0,
      learnerCapacity.remainingHours || 0
    )

    if (proposedHours <= 0 || proposedHours > maxAvailable) {
      alert(`Please select between 0.5 and ${maxAvailable} hours per week.`)
      return
    }

    setSubmitting(true)

    try {
      // Refresh session
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
      
      const { data: { session: currentSession }, error: sessionError } = refreshedSession 
        ? { data: { session: refreshedSession }, error: null }
        : await supabase.auth.getSession()

      if (sessionError || !currentSession) {
        throw new Error('You must be logged in to create a swap proposal. Please log in and try again.')
      }

      const teachSkillId = selectedSwap.teachSkill.skill_id
      const learnSkillId = selectedSwap.learnSkill.skill_id
      const theirUserId = otherUser?.id

      if (!teachSkillId || !learnSkillId || !theirUserId) {
        throw new Error('Missing required information. Please refresh and try again.')
      }

      // Check for duplicate proposal
      const { exists, swapId } = await checkDuplicateProposal(user.id, theirUserId, teachSkillId, learnSkillId)
      if (exists) {
        alert('You already have a pending proposal with this user for these skills.')
        navigate('/my-swaps')
        return
      }

      console.log('Creating swap proposal:', {
        userId: user.id,
        teachSkillId,
        learnSkillId,
        theirUserId,
        matchScore: selectedSwap.matchScore,
        hours: proposedHours,
        mode
      })

      // Create swap
      const { data: swapRecord, error: swapError } = await supabase
        .from('swaps')
        .insert({
          swap_type: 'direct',
          status: 'proposed',
          fairness_score: selectedSwap.matchScore || 50,
          balance_explanation: `Match score: ${selectedSwap.matchScore || 0}/100. ${proposedHours}h/week commitment.`,
        })
        .select()
        .single()

      if (swapError) {
        console.error('Swap creation error:', swapError)
        if (swapError.code === '42501' || swapError.message?.includes('permission') || swapError.message?.includes('policy')) {
          throw new Error('Permission denied (RLS policy violation). Please ensure you are logged in and try again.')
        }
        throw swapError
      }

      // Add participants with hours
      const { error: participantsError } = await supabase
        .from('swap_participants')
        .insert([
          {
            swap_id: swapRecord.id,
            user_id: user.id,
            teaching_skill_id: teachSkillId,
            learning_skill_id: learnSkillId,
            learning_from_user_id: theirUserId,
            teaching_hours_per_week: proposedHours,
            learning_hours_per_week: proposedHours,
            preferred_days: timePreferences.days ? [timePreferences.days] : null,
            preferred_times: timePreferences.time ? [timePreferences.time] : null,
          },
          {
            swap_id: swapRecord.id,
            user_id: theirUserId,
            teaching_skill_id: learnSkillId,
            learning_skill_id: teachSkillId,
            learning_from_user_id: user.id,
            teaching_hours_per_week: proposedHours,
            learning_hours_per_week: proposedHours,
          },
        ])

      if (participantsError) throw participantsError

      alert('Proposal sent successfully!')
      navigate('/my-swaps')
    } catch (error) {
      console.error('Error creating proposal:', error)
      alert('Failed to send proposal: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!mode || (!learnSkill && !teachSkill)) {
    return (
      <div className="card text-center py-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Invalid proposal state
        </h3>
        <p className="text-gray-600 mb-4">
          Please go back and try again.
        </p>
        <button onClick={() => navigate('/browse')} className="btn btn-primary">
          Back to Browse
        </button>
      </div>
    )
  }

  const hasMatches = possibleSwaps.length > 0
  const lockedSkill = mode === 'learn' ? learnSkill : teachSkill
  const lockedSide = mode === 'learn' ? 'learn' : 'teach'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="text-dark-400 hover:text-dark-200 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-3xl font-bold text-dark-100">Propose a Skill Swap</h1>
      </div>

      {/* Locked Skill Section */}
      <div className="card bg-dark-900 border border-dark-800">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <label className="block text-sm font-medium text-dark-300">
            Locked: You {lockedSide === 'learn' ? 'Learn' : 'Teach'}
          </label>
        </div>
        <div className="bg-dark-800/50 border border-dark-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-600 to-primary-600 flex items-center justify-center text-white font-semibold text-lg">
              {otherUser?.full_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-semibold text-dark-100 text-lg">
                {lockedSkill.skills?.name}
              </p>
              <p className="text-sm text-dark-400">
                {lockedSide === 'learn' ? 'from' : 'to'} {otherUser?.full_name || 'Anonymous'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Possible Swaps Section */}
      <div className="card bg-dark-900 border border-dark-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-dark-100">Possible Swaps</h2>
          {hasMatches && (
            <span className="text-sm text-dark-400">
              {possibleSwaps.length} swap{possibleSwaps.length !== 1 ? 's' : ''} found
            </span>
          )}
        </div>

        {selectedSwap ? (
          /* Hours Allocation Form */
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark-100">Allocate Hours for Swap</h3>
              <button
                onClick={() => setSelectedSwap(null)}
                className="text-sm text-dark-400 hover:text-dark-200 transition-colors"
              >
                ← Back to swap options
              </button>
            </div>

            {/* Selected Swap Summary */}
            <div className="bg-dark-800/50 border border-dark-700 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-dark-500 mb-1">You Teach:</p>
                  <p className="text-dark-100 font-semibold">
                    {selectedSwap.teachSkill?.skills?.name || selectedSwap.teachSkill?.name}
                  </p>
                </div>
                <div>
                  <p className="text-dark-500 mb-1">You Learn:</p>
                  <p className="text-dark-100 font-semibold">
                    {selectedSwap.learnSkill?.skills?.name || selectedSwap.learnSkill?.name}
                  </p>
                </div>
              </div>
            </div>

            <HoursAllocationForm
              teacherCapacity={teacherCapacity}
              learnerCapacity={learnerCapacity}
              onHoursChange={setProposedHours}
              onPreferencesChange={setTimePreferences}
              initialHours={proposedHours}
              initialPreferences={timePreferences}
            />

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setSelectedSwap(null)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmProposal}
                disabled={submitting || proposedHours <= 0}
                className="btn btn-primary flex-[2]"
              >
                {submitting ? 'Sending...' : 'Confirm & Send Proposal'}
              </button>
            </div>
          </div>
        ) : hasMatches ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {possibleSwaps.map((swap, index) => (
              <SwapMatchCard
                key={index}
                swap={swap}
                mode={mode}
                learnSkill={mode === 'learn' ? learnSkill : null}
                teachSkill={mode === 'teach' ? teachSkill : null}
                otherUser={otherUser}
                onProposeSwap={handleProposeSwap}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4">
            <div className="max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-full bg-dark-800 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-dark-100 mb-2">
                No matching swap found
              </h3>
              <p className="text-dark-400 mb-6">
                {mode === 'learn' 
                  ? "You don't have teaching skills that match what they want to learn."
                  : "They don't teach skills that match what you want to learn."}
              </p>

              {/* Show their teaching skills if in teach mode */}
              {mode === 'teach' && theirTeachingSkills.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm text-dark-300 mb-3">
                    {otherUser?.full_name || 'They'} teach{theirTeachingSkills.length === 1 ? 'es' : ''}:
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {theirTeachingSkills.map((skill, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 bg-dark-800/50 border border-dark-700 rounded-lg hover:border-primary-700 transition-colors"
                      >
                        <p className="text-sm font-medium text-dark-100">
                          {skill.skills?.name}
                        </p>
                        {skill.level && (
                          <p className="text-xs text-dark-400 mt-0.5">
                            {skill.level}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-dark-500 mt-3">
                    💡 Add one of these as a learning goal to create a swap opportunity
                  </p>
                </div>
              )}

              {/* Show their learning requests if in learn mode */}
              {mode === 'learn' && theirLearningRequests.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm text-dark-300 mb-3">
                    {otherUser?.full_name || 'They'} want{theirLearningRequests.length === 1 ? 's' : ''} to learn:
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {theirLearningRequests.map((skill, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 bg-dark-800/50 border border-dark-700 rounded-lg hover:border-primary-700 transition-colors"
                      >
                        <p className="text-sm font-medium text-dark-100">
                          {skill.skills?.name}
                        </p>
                        {skill.level && (
                          <p className="text-xs text-dark-400 mt-0.5">
                            {skill.level}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-dark-500 mt-3">
                    💡 Add one of these as a teaching skill to create a swap opportunity
                  </p>
                </div>
              )}

              <button
                onClick={() => setShowAddSkillModal(true)}
                className="btn btn-primary"
              >
                {mode === 'learn' ? 'Add a teaching skill' : 'Add a learning goal'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Skill Modal */}
      {showAddSkillModal && (
        <AddSkillModal
          onClose={() => setShowAddSkillModal(false)}
          onSkillAdded={handleSkillAdded}
          initialRole={mode === 'learn' ? 'teach' : 'learn'}
        />
      )}
    </div>
  )
}
