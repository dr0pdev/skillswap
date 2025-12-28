import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { calculateSkillValue, findMatches } from '../utils/matching'
import { fetchActiveSwaps, filterActiveSkills } from '../utils/activeSwaps'

export default function FindSwaps() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [matches, setMatches] = useState([])
  const [mySkills, setMySkills] = useState({ teaching: [], learning: [] })

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

      setMatches(potentialMatches)
    } catch (error) {
      console.error('Error finding matches:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProposeSwap = async (match) => {
    if (!confirm(`Propose a swap with ${match.partner.full_name}?`)) return

    try {
      // Create swap
      const { data: swap, error: swapError } = await supabase
        .from('swaps')
        .insert([{
          swap_type: 'direct',
          status: 'proposed',
          fairness_score: match.fairness_score,
          balance_explanation: match.explanation,
        }])
        .select()
        .single()

      if (swapError) throw swapError

      // Create participants
      const participants = [
        {
          swap_id: swap.id,
          user_id: user.id,
          teaching_skill_id: match.you_teach.skill_id,
          teaching_user_skill_id: match.you_teach.id,
          teaching_hours_per_week: match.you_teach.weekly_hours_available,
          learning_skill_id: match.you_learn.skill_id,
          learning_from_user_id: match.partner.id,
          learning_hours_per_week: match.they_teach.weekly_hours_available,
          giving_value: match.you_give_value,
          receiving_value: match.you_receive_value,
          has_accepted: true,
        },
        {
          swap_id: swap.id,
          user_id: match.partner.id,
          teaching_skill_id: match.they_teach.skill_id,
          teaching_user_skill_id: match.they_teach.id,
          teaching_hours_per_week: match.they_teach.weekly_hours_available,
          learning_skill_id: match.you_teach.skill_id,
          learning_from_user_id: user.id,
          learning_hours_per_week: match.you_teach.weekly_hours_available,
          giving_value: match.they_give_value,
          receiving_value: match.they_receive_value,
          has_accepted: false,
        },
      ]

      const { error: participantsError } = await supabase
        .from('swap_participants')
        .insert(participants)

      if (participantsError) throw participantsError

      // Create notification for partner
      await supabase.from('notifications').insert([{
        user_id: match.partner.id,
        type: 'swap_proposal',
        title: 'New Swap Proposal',
        message: `${profile.full_name} wants to swap ${match.you_teach.skills.name} for ${match.they_teach.skills.name}`,
        swap_id: swap.id,
        from_user_id: user.id,
      }])

      alert('Swap proposal sent!')
      fetchDataAndFindMatches()
    } catch (error) {
      console.error('Error proposing swap:', error)
      alert('Failed to propose swap: ' + error.message)
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
        <h1 className="text-3xl font-bold text-gray-900">Find Swaps</h1>
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Add Skills to Find Matches
          </h3>
          <p className="text-gray-600 mb-6">
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
        <h1 className="text-3xl font-bold text-gray-900">Find Swaps</h1>
        <p className="text-gray-600 mt-1">
          Fair matches based on skill value, demand, and availability
        </p>
      </div>

      {/* Match Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-600">Potential Matches</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{matches.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Your Teaching Skills</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {mySkills.teaching.length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Your Learning Goals</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {mySkills.learning.length}
          </p>
        </div>
      </div>

      {/* Matches List */}
      {matches.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">😔</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Matches Found Yet
          </h3>
          <p className="text-gray-600 mb-4">
            We couldn't find any fair matches at the moment. Try:
          </p>
          <ul className="text-sm text-gray-600 text-left max-w-md mx-auto space-y-2">
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
                      <h3 className="text-xl font-semibold text-gray-900">
                        {match.partner.full_name}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <span>⭐ {match.partner.reputation_score?.toFixed(1) || '50.0'}</span>
                        <span>🤝 {match.partner.total_swaps_completed || 0} swaps</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {match.fairness_score}/100
                      </div>
                      <div className="text-xs text-gray-600">Fairness Score</div>
                    </div>
                  </div>

                  {/* Exchange Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-xs text-blue-600 font-medium mb-1">
                        🎓 YOU TEACH
                      </p>
                      <p className="font-semibold text-gray-900">
                        {match.you_teach.skills.name}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Level: {match.you_teach.level} • {match.you_teach.weekly_hours_available}h/week
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Value: {match.you_give_value.toFixed(0)} points
                      </p>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <p className="text-xs text-purple-600 font-medium mb-1">
                        📚 YOU LEARN
                      </p>
                      <p className="font-semibold text-gray-900">
                        {match.they_teach.skills.name}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Level: {match.they_teach.level} • {match.they_teach.weekly_hours_available}h/week
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Value: {match.you_receive_value.toFixed(0)} points
                      </p>
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      ⚖️ Why This Match is Fair:
                    </p>
                    <p className="text-sm text-gray-700">{match.explanation}</p>
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
    </div>
  )
}

