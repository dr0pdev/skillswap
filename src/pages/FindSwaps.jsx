import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { calculateSkillValue, findMatches } from '../utils/matching'
import { fetchActiveSwaps, filterActiveSkills } from '../utils/activeSwaps'
import { calculateRemainingHours } from '../utils/capacity'
import HoursAllocationForm from '../components/swaps/HoursAllocationForm'
import UserProfileModal from '../components/modals/UserProfileModal'
import ChatModal from '../components/modals/ChatModal'

export default function FindSwaps() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [matches, setMatches] = useState([])
  const [mySkills, setMySkills] = useState({ teaching: [], learning: [] })
  const [selectedMatch, setSelectedMatch] = useState(null) // For hours selection
  const [proposedHours, setProposedHours] = useState(1)
  const [timePreferences, setTimePreferences] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showChatModal, setShowChatModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    if (user?.id && profile?.id) {
      fetchDataAndFindMatches()
    } else {
      setLoading(false)
    }
  }, [user, profile])

  const fetchDataAndFindMatches = async () => {
    if (!user?.id || !profile?.id) {
      setLoading(false)
      return
    }

    try {
      // Fetch user's skills
      const { data: userSkills } = await supabase
        .from('user_skills')
        .select('*, skills(*)')
        .eq('user_id', user.id)
        .eq('is_active', true)

      const teaching = userSkills?.filter(s => s.role === 'teach') || []
      const learning = userSkills?.filter(s => s.role === 'learn') || []

      // Fetch active swaps to exclude skills already being learned
      const { activeLearnSkillIds } = await fetchActiveSwaps(user.id)

      // Filter out learning skills that are already in active swaps
      const availableLearningSkills = filterActiveSkills(learning, activeLearnSkillIds, 'skill_id')

      setMySkills({ teaching, learning: availableLearningSkills })

      if (teaching.length === 0 || availableLearningSkills.length === 0) {
        setLoading(false)
        return
      }

      // Find potential matches using ONLY available (non-active) learning skills
      const potentialMatches = await findMatches(user.id, teaching, availableLearningSkills, profile)

      console.log('FindSwaps: Found', potentialMatches.length, 'potential matches BEFORE capacity check')
      console.log('Potential matches:', potentialMatches)

      // Filter matches by capacity - both sides must have available hours
      const capacityCheckedMatches = await Promise.all(
        potentialMatches.map(async (match) => {
          try {
            // Check if I have capacity to teach
            const myTeachCapacity = await calculateRemainingHours(
              user.id,
              match.you_teach.skill_id,
              'teach'
            )

            // Check if they have capacity to teach me
            const theirTeachCapacity = await calculateRemainingHours(
              match.partner.id,
              match.they_teach.skill_id,
              'teach'
            )

            console.log('Capacity check for match:', {
              mySkill: match.you_teach.skills?.name,
              myCapacity: myTeachCapacity,
              theirSkill: match.they_teach.skills?.name,
              theirCapacity: theirTeachCapacity,
              passesCheck: myTeachCapacity.remainingHours >= 0.5 && theirTeachCapacity.remainingHours >= 0.5
            })

            // Both must have at least 0.5h/week available (or unlimited)
            const myHasCapacity = myTeachCapacity.isUnlimited || myTeachCapacity.remainingHours >= 0.5
            const theirHasCapacity = theirTeachCapacity.isUnlimited || theirTeachCapacity.remainingHours >= 0.5
            
            if (myHasCapacity && theirHasCapacity) {
              const maxHours = Math.min(
                myTeachCapacity.isUnlimited ? 10 : myTeachCapacity.remainingHours,
                theirTeachCapacity.isUnlimited ? 10 : theirTeachCapacity.remainingHours
              )
              
              return {
                ...match,
                myTeachCapacity,
                theirTeachCapacity,
                maxPossibleHours: maxHours,
                isLimitedAvailability: (
                  (!myTeachCapacity.isUnlimited && myTeachCapacity.remainingHours < 2) ||
                  (!theirTeachCapacity.isUnlimited && theirTeachCapacity.remainingHours < 2)
                )
              }
            }
            console.warn('Match filtered out due to capacity:', match)
            return null
          } catch (error) {
            console.error('Error checking capacity for match:', error, match)
            return null
          }
        })
      )

      // Filter out null values (matches with no capacity)
      const validMatches = capacityCheckedMatches.filter(Boolean)
      
      console.log(`FindSwaps: ${potentialMatches.length} potential matches, ${validMatches.length} with capacity`)
      
      setMatches(validMatches)
    } catch (error) {
      console.error('Error finding matches:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProposeSwap = (match) => {
    // Show hours selection form
    setSelectedMatch(match)
    setProposedHours(1)
    setTimePreferences({})
  }

  const handleConfirmProposal = async () => {
    if (!selectedMatch) return
    
    // Validate hours
    const maxHours = selectedMatch.maxPossibleHours || 10
    if (proposedHours <= 0 || proposedHours > maxHours) {
      alert(`Please select between 0.5 and ${maxHours} hours per week.`)
      return
    }

    setSubmitting(true)

    try {
      // Create swap
      const { data: swap, error: swapError } = await supabase
        .from('swaps')
        .insert([{
          swap_type: 'direct',
          status: 'proposed',
          fairness_score: selectedMatch.fairness_score,
          balance_explanation: selectedMatch.explanation,
        }])
        .select()
        .single()

      if (swapError) throw swapError

      // Create participants with hours
      const participants = [
        {
          swap_id: swap.id,
          user_id: user.id,
          teaching_skill_id: selectedMatch.you_teach.skill_id,
          teaching_user_skill_id: selectedMatch.you_teach.id,
          teaching_hours_per_week: proposedHours,
          learning_skill_id: selectedMatch.you_learn.skill_id,
          learning_from_user_id: selectedMatch.partner.id,
          learning_hours_per_week: proposedHours,
          preferred_days: timePreferences.days ? [timePreferences.days] : null,
          preferred_times: timePreferences.time ? [timePreferences.time] : null,
          giving_value: selectedMatch.you_give_value,
          receiving_value: selectedMatch.you_receive_value,
          has_accepted: true,
        },
        {
          swap_id: swap.id,
          user_id: selectedMatch.partner.id,
          teaching_skill_id: selectedMatch.they_teach.skill_id,
          teaching_user_skill_id: selectedMatch.they_teach.id,
          teaching_hours_per_week: proposedHours,
          learning_skill_id: selectedMatch.you_teach.skill_id,
          learning_from_user_id: user.id,
          learning_hours_per_week: proposedHours,
          giving_value: selectedMatch.they_give_value,
          receiving_value: selectedMatch.they_receive_value,
          has_accepted: false,
        },
      ]

      const { error: participantsError } = await supabase
        .from('swap_participants')
        .insert(participants)

      if (participantsError) throw participantsError

      // Create notification for partner
      await supabase.from('notifications').insert([{
        user_id: selectedMatch.partner.id,
        type: 'swap_proposal',
        title: 'New Swap Proposal',
        message: `${profile.full_name} wants to swap ${selectedMatch.you_teach.skills.name} for ${selectedMatch.they_teach.skills.name}`,
        swap_id: swap.id,
        from_user_id: user.id,
      }])

      alert('Swap proposal sent!')
      setSelectedMatch(null)
      fetchDataAndFindMatches() // Refresh
    } catch (error) {
      console.error('Error proposing swap:', error)
      alert('Failed to propose swap: ' + error.message)
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

  if (mySkills.teaching.length === 0 || mySkills.learning.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold" style={{ color: '#0C243D' }}>Find Swaps</h1>
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: '#0C243D' }}>
            Add Skills to Find Matches
          </h3>
          <p className="mb-6" style={{ color: '#0C243D' }}>
            {mySkills.teaching.length === 0 && mySkills.learning.length === 0
              ? 'Add both skills you can teach and skills you want to learn to find swap matches.'
              : mySkills.teaching.length === 0
              ? 'Add at least one skill you can teach to find matches.'
              : 'Add at least one skill you want to learn to find matches.'}
          </p>
          <a href="/skills" className="btn btn-primary">
            Add Skills
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: '#0C243D' }}>Find Swaps</h1>
        <p className="mt-1" style={{ color: '#0C243D' }}>
          Fair matches based on skill value, demand, and availability
        </p>
      </div>

      {/* Match Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-white">Potential Matches</p>
          <p className="text-2xl font-bold mt-1 text-white">{matches.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-white">Your Teaching Skills</p>
          <p className="text-2xl font-bold text-green-400 mt-1">
            {mySkills.teaching.length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-white">Your Learning Goals</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">
            {mySkills.learning.length}
          </p>
        </div>
      </div>

      {/* Matches List */}
      {selectedMatch ? (
        /* Hours Allocation Form for selected match */
        <div className="card" style={{ backgroundColor: '#1e293b' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Configure Hours for Swap</h2>
            <button
              onClick={() => setSelectedMatch(null)}
              className="text-sm transition-colors text-white hover:opacity-70"
            >
              ← Back to matches
            </button>
          </div>

          {/* Selected Match Summary */}
          <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="mb-1 text-white">You Teach:</p>
                <p className="font-semibold text-white">
                  {selectedMatch.you_teach.skills?.name}
                </p>
              </div>
              <div>
                <p className="mb-1 text-white">You Learn:</p>
                <p className="font-semibold text-white">
                  {selectedMatch.they_teach.skills?.name}
                </p>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-600">
              <p className="text-xs text-white">
                Partner: <span className="font-medium">{selectedMatch.partner.full_name}</span>
              </p>
              <p className="text-xs mt-1 text-white">
                Fairness Score: <span className="font-medium text-primary-400">{selectedMatch.fairness_score}%</span>
              </p>
            </div>
          </div>

          <HoursAllocationForm
            teacherCapacity={selectedMatch.myTeachCapacity}
            learnerCapacity={selectedMatch.theirTeachCapacity}
            onHoursChange={setProposedHours}
            onPreferencesChange={setTimePreferences}
            initialHours={proposedHours}
            initialPreferences={timePreferences}
          />

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setSelectedMatch(null)}
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
      ) : matches.length === 0 ? (
        <div className="card text-center py-12" style={{ backgroundColor: '#1e293b' }}>
          <div className="text-6xl mb-4">😔</div>
          <h3 className="text-xl font-semibold mb-2 text-white">
            No Matches Found Yet
          </h3>
          <p className="mb-4 text-white">
            We couldn't find any fair matches at the moment. Try:
          </p>
          <ul className="text-sm text-left max-w-md mx-auto space-y-2 text-white">
            <li>• Adding more skills you can teach</li>
            <li>• Expanding your learning interests</li>
            <li>• Checking back later as more users join</li>
          </ul>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match, index) => (
            <div key={index} className="card hover:shadow-lg transition-shadow">
              <div className="flex flex-col lg:flex-row justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        {match.partner.full_name}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-white">
                        <span>⭐ {match.partner.reputation_score?.toFixed(1) || '50.0'}</span>
                        <span>🤝 {match.partner.total_swaps_completed || 0} swaps</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Profile Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedUser(match.partner)
                          setShowProfileModal(true)
                        }}
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-300 flex items-center justify-center transition-colors group"
                        title="View Profile"
                      >
                        <svg className="w-4 h-4 text-gray-600 group-hover:text-primary-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </button>
                      
                      {/* Chat Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedUser(match.partner)
                          setShowChatModal(true)
                        }}
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-300 flex items-center justify-center transition-colors group"
                        title="Chat"
                      >
                        <svg className="w-4 h-4 text-gray-600 group-hover:text-accent-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </button>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-400">
                          {match.fairness_score}/100
                        </div>
                        <div className="text-xs text-white">Fairness Score</div>
                      </div>
                    </div>
                  </div>

                  {/* Exchange Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-600 border border-blue-500 rounded-lg p-4">
                      <p className="text-xs text-blue-200 font-medium mb-1">
                        🎓 YOU TEACH
                      </p>
                      <p className="font-semibold text-white">
                        {match.you_teach.skills.name}
                      </p>
                      <p className="text-sm mt-1 text-white">
                        Level: {match.you_teach.level} • Available: {match.myTeachCapacity?.remainingHours || 0}h/week
                      </p>
                      {match.you_teach.ai_explanation && (
                        <div className="mt-2 pt-2 border-t border-blue-200">
                          <p className="text-xs font-medium text-blue-200 mb-1">Your Expertise:</p>
                          <p className="text-xs text-white leading-relaxed">
                            {match.you_teach.ai_explanation}
                          </p>
                        </div>
                      )}
                      <p className="text-xs mt-2 text-white">
                        Value: {match.you_give_value.toFixed(0)} points
                      </p>
                    </div>

                    <div className="bg-purple-600 border border-purple-500 rounded-lg p-4">
                      <p className="text-xs text-purple-200 font-medium mb-1">
                        📚 YOU LEARN
                      </p>
                      <p className="font-semibold text-white">
                        {match.they_teach.skills.name}
                      </p>
                      <p className="text-sm mt-1 text-white">
                        Level: {match.they_teach.level} • Available: {match.theirTeachCapacity?.remainingHours || 0}h/week
                      </p>
                      {match.they_teach.ai_explanation && (
                        <div className="mt-2 pt-2 border-t border-purple-200">
                          <p className="text-xs font-medium text-purple-200 mb-1">Their Expertise:</p>
                          <p className="text-xs text-white leading-relaxed">
                            {match.they_teach.ai_explanation}
                          </p>
                        </div>
                      )}
                      <p className="text-xs mt-2 text-white">
                        Value: {match.you_receive_value.toFixed(0)} points
                      </p>
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                    <p className="text-sm font-medium mb-2 text-white">
                      ⚖️ Why This Match is Fair:
                    </p>
                    <p className="text-sm text-white">{match.explanation}</p>
                  </div>
                </div>

                <div className="flex lg:flex-col justify-end lg:justify-start gap-2">
                  <button
                    onClick={() => handleProposeSwap(match)}
                    className="btn btn-primary whitespace-nowrap"
                  >
                    Propose Swap
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showProfileModal && selectedUser && (
        <UserProfileModal 
          userId={selectedUser.id} 
          onClose={() => {
            setShowProfileModal(false)
            setSelectedUser(null)
          }} 
        />
      )}
      
      {showChatModal && selectedUser && (
        <ChatModal 
          partner={selectedUser}
          onClose={() => {
            setShowChatModal(false)
            setSelectedUser(null)
          }} 
        />
      )}
    </div>
  )
}

