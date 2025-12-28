import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { supabase } from '../../lib/supabase'
import AIAssessment from './AIAssessment'
import { 
  SKILL_CATEGORIES, 
  SKILL_ROLES, 
  PREFERRED_FORMATS,
  PREFERRED_FORMAT_LABELS,
  ERROR_MESSAGES 
} from '../../utils/constants'

export default function AddSkillModal({ onClose, onSkillAdded, initialRole }) {
  const { user } = useAuth()
  const { error: showError } = useToast()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    skillName: '',
    category: '',
    role: initialRole || SKILL_ROLES.TEACH,
    level: '',
    difficultyScore: '',
    weeklyHours: '',
    preferredFormat: PREFERRED_FORMATS.BOTH,
    notes: '',
  })

  const [aiAssessment, setAiAssessment] = useState(null)
  const [showAIAssessment, setShowAIAssessment] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleAIAssessmentComplete = (assessment) => {
    setAiAssessment(assessment)
    setFormData({
      ...formData,
      level: assessment.level,
      difficultyScore: assessment.difficulty,
    })
    setShowAIAssessment(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Prevent double submission
    if (loading) return
    
    setLoading(true)

    try {
      // Check if skill exists (use maybeSingle to handle 0 or 1 results)
      let { data: existingSkill, error: searchError } = await supabase
        .from('skills')
        .select('id')
        .ilike('name', formData.skillName.trim())
        .maybeSingle()

      // If there's a search error (but not "not found"), log it but continue
      if (searchError && searchError.code !== 'PGRST116') {
        console.warn('Skill search error:', searchError)
      }

      let skillId = existingSkill?.id

      // If skill doesn't exist, create it
      if (!skillId) {
        const { data: newSkill, error: createError } = await supabase
          .from('skills')
          .insert([{
            name: formData.skillName.trim(),
            category: formData.category,
            is_active: true,
          }])
          .select('id')
          .single()

        if (createError) throw createError
        skillId = newSkill.id
      }

      // Check if user already has this skill with this role
      const { data: existingUserSkill, error: checkError } = await supabase
        .from('user_skills')
        .select('id, is_active')
        .eq('user_id', user.id)
        .eq('skill_id', skillId)
        .eq('role', formData.role)
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') {
        console.warn('Check existing skill error:', checkError)
      }

      // If user already has this skill with this role
      if (existingUserSkill) {
        if (existingUserSkill.is_active) {
          // Skill already exists and is active
          const roleLabel = formData.role === 'teach' ? 'teaching' : 'learning'
          showError(`You already have "${formData.skillName.trim()}" in your ${roleLabel} skills.`)
          setLoading(false)
          return
        } else {
          // Skill exists but is inactive - reactivate it
          const skillData = {
            is_active: true,
            preferred_format: formData.preferredFormat,
            notes: formData.notes,
          }

          if (formData.role === 'teach') {
            skillData.level = formData.level
            skillData.difficulty_score = parseFloat(formData.difficultyScore)
            skillData.weekly_hours_available = parseFloat(formData.weeklyHours)
          }

          if (aiAssessment) {
            skillData.ai_suggested_level = aiAssessment.level
            skillData.ai_suggested_difficulty = aiAssessment.difficulty
            skillData.ai_explanation = aiAssessment.explanation
            skillData.ai_assessed_at = new Date().toISOString()
          }

          const { error: updateError } = await supabase
            .from('user_skills')
            .update(skillData)
            .eq('id', existingUserSkill.id)

          if (updateError) throw updateError

          onSkillAdded()
          setLoading(false)
          return
        }
      }

      // Create new user_skill entry
      const skillData = {
        user_id: user.id,
        skill_id: skillId,
        role: formData.role,
        preferred_format: formData.preferredFormat,
        notes: formData.notes,
      }

      if (formData.role === 'teach') {
        skillData.level = formData.level
        skillData.difficulty_score = parseFloat(formData.difficultyScore)
        skillData.weekly_hours_available = parseFloat(formData.weeklyHours)
      }

      if (aiAssessment) {
        skillData.ai_suggested_level = aiAssessment.level
        skillData.ai_suggested_difficulty = aiAssessment.difficulty
        skillData.ai_explanation = aiAssessment.explanation
        skillData.ai_assessed_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('user_skills')
        .insert([skillData])

      if (error) {
        // Handle duplicate key error specifically
        if (error.code === '23505') {
          const roleLabel = formData.role === 'teach' ? 'teaching' : 'learning'
          showError(`You already have "${formData.skillName.trim()}" in your ${roleLabel} skills.`)
          setLoading(false)
          return
        }
        throw error
      }

      onSkillAdded()
    } catch (error) {
      console.error('Error adding skill:', error)
      
      // Handle duplicate key error
      if (error.code === '23505' || error.message?.includes('duplicate key')) {
        const roleLabel = formData.role === 'teach' ? 'teaching' : 'learning'
        showError(`You already have "${formData.skillName.trim()}" in your ${roleLabel} skills.`)
      } else {
        showError(ERROR_MESSAGES.SKILL_ADD_ERROR)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="modal-content max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-dark-900/95 backdrop-blur-sm border-b border-dark-800 px-6 py-4 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center">
                {formData.role === 'teach' ? (
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                )}
              </div>
              <h2 className="text-2xl font-bold text-dark-100">
                {formData.role === 'teach' ? 'Offer a Skill' : 'Request a Skill'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-dark-400 hover:text-dark-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Role Selection */}
            <div>
              <label className="label">I want to:</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: SKILL_ROLES.TEACH })}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    formData.role === SKILL_ROLES.TEACH
                      ? 'border-primary-600 bg-primary-950/30'
                      : 'border-dark-800 hover:border-dark-700 bg-dark-900/50'
                  }`}
                >
                  <svg className="w-8 h-8 text-primary-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <div className="font-semibold text-dark-100">Offer/Teach</div>
                  <div className="text-sm text-dark-400">Share your knowledge</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: SKILL_ROLES.LEARN })}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    formData.role === SKILL_ROLES.LEARN
                      ? 'border-accent-600 bg-accent-950/30'
                      : 'border-dark-800 hover:border-dark-700 bg-dark-900/50'
                  }`}
                >
                  <svg className="w-8 h-8 text-accent-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <div className="font-semibold text-dark-100">Request/Learn</div>
                  <div className="text-sm text-dark-400">Expand your abilities</div>
                </button>
              </div>
            </div>

            {/* Skill Name */}
            <div>
              <label className="label">Skill Name *</label>
              <input
                type="text"
                name="skillName"
                value={formData.skillName}
                onChange={handleChange}
                className="input"
                placeholder="e.g., React Development, Spanish Language, Guitar Playing..."
                required
              />
              <p className="text-xs text-dark-500 mt-1">
                Enter any skill you want to {formData.role === 'teach' ? 'offer' : 'learn'}
              </p>
            </div>

            {/* Category Selection */}
            <div>
              <label className="label">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="">Select a category...</option>
                {SKILL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <p className="text-xs text-dark-500 mt-1">
                Choose the category that best fits your skill
              </p>
            </div>

            {/* Teaching Details */}
            {formData.role === SKILL_ROLES.TEACH && (
              <>
                <div className="border-t border-dark-800 pt-6">
                  <h3 className="text-lg font-semibold text-dark-100 mb-4">
                    Teaching Details
                  </h3>
                  
                  {!showAIAssessment && formData.skillName && (
                    <button
                      type="button"
                      onClick={() => setShowAIAssessment(true)}
                      className="btn btn-secondary w-full mb-4 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Use AI to Assess My Skill Level
                    </button>
                  )}
                  
                  {showAIAssessment && formData.skillName && (
                    <AIAssessment
                      skillName={formData.skillName}
                      onComplete={handleAIAssessmentComplete}
                      onCancel={() => setShowAIAssessment(false)}
                    />
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Your Level *</label>
                      <select
                        name="level"
                        value={formData.level}
                        onChange={handleChange}
                        className="input"
                        required
                      >
                        <option value="">Select level...</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Difficulty Score (0-100) *</label>
                      <input
                        type="number"
                        name="difficultyScore"
                        value={formData.difficultyScore}
                        onChange={handleChange}
                        className="input"
                        min="0"
                        max="100"
                        placeholder="50"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Hours Available per Week *</label>
                    <input
                      type="number"
                      name="weeklyHours"
                      value={formData.weeklyHours}
                      onChange={handleChange}
                      className="input"
                      min="0"
                      step="0.5"
                      placeholder="e.g., 2.5"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* Preferred Format */}
            <div>
              <label className="label">Preferred Format</label>
              <select
                name="preferredFormat"
                value={formData.preferredFormat}
                onChange={handleChange}
                className="input"
              >
                <option value={PREFERRED_FORMATS.ONLINE}>
                  {PREFERRED_FORMAT_LABELS[PREFERRED_FORMATS.ONLINE]}
                </option>
                <option value={PREFERRED_FORMATS.IN_PERSON}>
                  {PREFERRED_FORMAT_LABELS[PREFERRED_FORMATS.IN_PERSON]}
                </option>
                <option value={PREFERRED_FORMATS.BOTH}>
                  {PREFERRED_FORMAT_LABELS[PREFERRED_FORMATS.BOTH]}
                </option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="label">Additional Notes (Optional)</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="input"
                rows="3"
                placeholder="Any additional information about your skill or what you're looking for..."
              />
            </div>

            {aiAssessment && (
              <div className="bg-success-950/20 border border-success-800/30 rounded-lg p-4">
                <p className="text-sm font-medium text-success-400 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  AI Assessment Applied
                </p>
                <p className="text-sm text-dark-300">
                  {aiAssessment.explanation}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-dark-800">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.skillName || !formData.category}
                className="btn btn-primary"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="spinner-small"></div>
                    Adding...
                  </span>
                ) : (
                  `${formData.role === SKILL_ROLES.TEACH ? 'Offer' : 'Request'} Skill`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
