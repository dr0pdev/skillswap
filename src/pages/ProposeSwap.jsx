import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import AIMatchEvaluation from '../components/swaps/AIMatchEvaluation'

export default function ProposeSwap() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const [targetSkill, setTargetSkill] = useState(null)
  const [mode, setMode] = useState(null) // 'request-to-learn' or 'offer-to-teach'
  const [mySkills, setMySkills] = useState([])
  const [selectedSkillId, setSelectedSkillId] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showEvaluation, setShowEvaluation] = useState(false)
  const [evaluation, setEvaluation] = useState(null)

  useEffect(() => {
    if (location.state) {
      setTargetSkill(location.state.targetSkill)
      setMode(location.state.mode)
    } else {
      // No state passed, redirect back
      navigate('/browse')
    }
  }, [location.state])

  useEffect(() => {
    if (user && mode) {
      fetchMySkills()
    }
  }, [user, mode])

  const fetchMySkills = async () => {
    try {
      setLoading(true)
      // If mode is 'request-to-learn', fetch my teaching skills
      // If mode is 'offer-to-teach', fetch my learning skills
      const roleToFetch = mode === 'request-to-learn' ? 'teach' : 'learn'

      const { data, error } = await supabase
        .from('user_skills')
        .select('*, skills(*)')
        .eq('user_id', user.id)
        .eq('role', roleToFetch)
        .eq('is_active', true)

      if (error) throw error
      setMySkills(data || [])
    } catch (error) {
      console.error('Error fetching skills:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEvaluate = async () => {
    if (!selectedSkillId) {
      alert('Please select a skill')
      return
    }

    const selectedSkill = mySkills.find((s) => s.id === selectedSkillId)
    if (!selectedSkill) return

    setShowEvaluation(true)
    setEvaluation({ loading: true })

    // Calculate match evaluation
    try {
      const evaluationResult = await calculateMatchEvaluation(
        selectedSkill,
        targetSkill,
        profile
      )
      setEvaluation(evaluationResult)
    } catch (error) {
      console.error('Error evaluating match:', error)
      setEvaluation({
        loading: false,
        error: 'Failed to evaluate match',
      })
    }
  }

  const calculateMatchEvaluation = async (mySkill, theirSkill, userProfile) => {
    // Simplified match calculation
    const myDifficulty = mySkill.difficulty_score || 50
    const theirDifficulty = theirSkill.difficulty_score || 50
    const difficultyDiff = Math.abs(myDifficulty - theirDifficulty)

    const myHours = mySkill.weekly_hours_available || 0
    const theirHours = theirSkill.weekly_hours_available || 0
    const hoursDiff = Math.abs(myHours - theirHours)

    // Calculate fairness score
    let fairnessScore = 100
    fairnessScore -= difficultyDiff * 0.5
    fairnessScore -= hoursDiff * 2

    fairnessScore = Math.max(0, Math.min(100, fairnessScore))

    // Determine match strength
    let matchStrength = 'Strong'
    if (fairnessScore < 70) matchStrength = 'Moderate'
    if (fairnessScore < 50) matchStrength = 'Weak'

    // Determine feasibility
    let feasibility = 'Feasible'
    if (difficultyDiff > 30 || hoursDiff > 3) {
      feasibility = 'Feasible with concerns'
    }
    if (difficultyDiff > 50 || hoursDiff > 5) {
      feasibility = 'Not recommended'
    }

    // Generate explanation
    const points = []
    
    if (difficultyDiff <= 15) {
      points.push({ type: 'success', text: 'Skill difficulty levels are well-matched' })
    } else if (difficultyDiff <= 30) {
      points.push({ type: 'warning', text: `Moderate difficulty gap (${difficultyDiff} points)` })
    } else {
      points.push({ type: 'error', text: `Large difficulty gap (${difficultyDiff} points)` })
    }

    if (hoursDiff <= 1) {
      points.push({ type: 'success', text: 'Time commitments are compatible' })
    } else if (hoursDiff <= 3) {
      points.push({ type: 'warning', text: `Time commitment differs by ${hoursDiff} hours/week` })
    } else {
      points.push({ type: 'error', text: `Significant time difference (${hoursDiff} hours/week)` })
    }

    if (userProfile?.reputation_score >= 70) {
      points.push({ type: 'success', text: 'You have good reputation' })
    }

    if (theirSkill.users?.reputation_score >= 70) {
      points.push({ type: 'success', text: 'Other user has good reputation' })
    }

    return {
      loading: false,
      matchStrength,
      feasibility,
      fairnessScore,
      explanation: points,
    }
  }

  const handleSubmitProposal = async () => {
    if (!selectedSkillId) {
      alert('Please select a skill')
      return
    }

    setSubmitting(true)

    try {
      const selectedSkill = mySkills.find((s) => s.id === selectedSkillId)

      // Determine who is teaching what
      let initiatorTeachingSkillId, initiatorLearningSkillId
      let recipientTeachingSkillId, recipientLearningSkillId

      if (mode === 'request-to-learn') {
        // I want to learn their skill, I'll teach mine
        initiatorTeachingSkillId = selectedSkill.skill_id
        initiatorLearningSkillId = targetSkill.skill_id
        recipientTeachingSkillId = targetSkill.skill_id
        recipientLearningSkillId = selectedSkill.skill_id
      } else {
        // They want to learn something, I'll teach it
        initiatorTeachingSkillId = selectedSkill.skill_id
        initiatorLearningSkillId = targetSkill.skill_id
        recipientTeachingSkillId = targetSkill.skill_id
        recipientLearningSkillId = selectedSkill.skill_id
      }

      // Create swap
      const { data: swap, error: swapError } = await supabase
        .from('swaps')
        .insert({
          status: 'proposed',
          fairness_score: evaluation?.fairnessScore || 50,
          ai_match_strength: evaluation?.matchStrength || 'Moderate',
          ai_evaluation_notes: JSON.stringify(evaluation?.explanation || []),
        })
        .select()
        .single()

      if (swapError) throw swapError

      // Add participants
      const { error: participantsError } = await supabase
        .from('swap_participants')
        .insert([
          {
            swap_id: swap.id,
            user_id: user.id,
            teaching_skill_id: initiatorTeachingSkillId,
            learning_skill_id: initiatorLearningSkillId,
            learning_from_user_id: targetSkill.user_id,
          },
          {
            swap_id: swap.id,
            user_id: targetSkill.user_id,
            teaching_skill_id: recipientTeachingSkillId,
            learning_skill_id: recipientLearningSkillId,
            learning_from_user_id: user.id,
          },
        ])

      if (participantsError) throw participantsError

      // Success!
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

  if (!targetSkill || !mode) {
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

  if (mySkills.length === 0) {
    return (
      <div className="card text-center py-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          You need to offer a skill first
        </h3>
        <p className="text-gray-600 mb-4">
          To propose a swap, you need to have at least one{' '}
          {mode === 'request-to-learn' ? 'teaching' : 'learning'} skill.
        </p>
        <button
          onClick={() => navigate('/skills')}
          className="btn btn-primary"
        >
          Add a Skill
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-600 hover:text-gray-900"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Propose a Skill Swap</h1>
      </div>

      <div className="card">
        {/* Target Skill Info */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {mode === 'request-to-learn'
              ? 'You want to learn:'
              : 'They want to learn:'}
          </label>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                {targetSkill.users?.full_name?.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {targetSkill.skills?.name}
                </p>
                <p className="text-sm text-gray-600">
                  from {targetSkill.users?.full_name || 'Anonymous'}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap mt-2">
              {targetSkill.level && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                  {targetSkill.level}
                </span>
              )}
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                {targetSkill.skills?.category}
              </span>
            </div>
          </div>
        </div>

        {/* My Skills Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {mode === 'request-to-learn'
              ? 'You will teach:'
              : 'You want to learn:'}
          </label>
          <select
            value={selectedSkillId}
            onChange={(e) => {
              setSelectedSkillId(e.target.value)
              setShowEvaluation(false)
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Select a skill...</option>
            {mySkills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.skills?.name} - {skill.level || 'Not specified'}
              </option>
            ))}
          </select>
        </div>

        {/* Evaluate Button */}
        {selectedSkillId && !showEvaluation && (
          <button
            onClick={handleEvaluate}
            className="btn btn-secondary w-full mb-6"
          >
            Evaluate Match
          </button>
        )}

        {/* AI Match Evaluation */}
        {showEvaluation && evaluation && (
          <AIMatchEvaluation evaluation={evaluation} />
        )}

        {/* Action Buttons */}
        {showEvaluation && evaluation && !evaluation.loading && (
          <div className="flex gap-4 mt-6">
            <button
              onClick={handleSubmitProposal}
              disabled={submitting}
              className="btn btn-primary flex-1"
            >
              {submitting ? 'Sending...' : 'Send Proposal'}
            </button>
            <button
              onClick={() => {
                setSelectedSkillId('')
                setShowEvaluation(false)
              }}
              className="btn btn-secondary flex-1"
            >
              Choose Different Skill
            </button>
          </div>
        )}

        {!showEvaluation && (
          <button
            onClick={() => navigate(-1)}
            className="btn btn-secondary w-full"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}

