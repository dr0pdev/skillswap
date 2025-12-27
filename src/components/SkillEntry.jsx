import { useState, useEffect, useRef } from 'react'
import { CheckCircle, Sparkles, TrendingUp, Clock, Award } from 'lucide-react'

const SkillEntry = () => {
  const [offerSkill, setOfferSkill] = useState({
    name: '',
    experienceLevel: '',
    timeCommitment: '',
  })

  const [wantSkill, setWantSkill] = useState({
    name: '',
    experienceLevel: '',
    timeCommitment: '',
  })

  const [offerValue, setOfferValue] = useState(0)
  const [wantValue, setWantValue] = useState(0)
  const [offerValidated, setOfferValidated] = useState(false)
  const [wantValidated, setWantValidated] = useState(false)
  const offerTypingTimeoutRef = useRef(null)
  const wantTypingTimeoutRef = useRef(null)

  // Simulate AI evaluation of skill value
  const evaluateSkillValue = (skill) => {
    let score = 0

    // Skill name length and quality (0-40 points)
    if (skill.name.length > 0) {
      score += Math.min(20, skill.name.length * 2)
      // Bonus for common tech skills
      const techKeywords = ['react', 'javascript', 'python', 'design', 'ui', 'ux', 'data', 'machine', 'web', 'mobile', 'backend', 'frontend']
      if (techKeywords.some(keyword => skill.name.toLowerCase().includes(keyword))) {
        score += 10
      }
    }

    // Experience level (0-30 points)
    const levelScores = {
      'Junior': 15,
      'Mid': 25,
      'Senior': 30,
    }
    if (skill.experienceLevel) {
      score += levelScores[skill.experienceLevel] || 0
    }

    // Time commitment (0-30 points)
    const hours = parseInt(skill.timeCommitment) || 0
    if (hours > 0) {
      if (hours >= 10) score += 30
      else if (hours >= 5) score += 20
      else if (hours >= 2) score += 10
      else score += 5
    }

    return Math.min(100, Math.round(score))
  }

  // Handle offer skill changes
  useEffect(() => {
    if (offerSkill.name || offerSkill.experienceLevel || offerSkill.timeCommitment) {
      const value = evaluateSkillValue(offerSkill)
      setOfferValue(value)
    } else {
      setOfferValue(0)
    }
  }, [offerSkill])

  // Handle want skill changes
  useEffect(() => {
    if (wantSkill.name || wantSkill.experienceLevel || wantSkill.timeCommitment) {
      const value = evaluateSkillValue(wantSkill)
      setWantValue(value)
    } else {
      setWantValue(0)
    }
  }, [wantSkill])

  // Handle skill validation (show badge after user stops typing)
  useEffect(() => {
    if (offerTypingTimeoutRef.current) {
      clearTimeout(offerTypingTimeoutRef.current)
    }

    if (offerSkill.name && offerSkill.experienceLevel && offerSkill.timeCommitment) {
      offerTypingTimeoutRef.current = setTimeout(() => {
        setOfferValidated(true)
      }, 1500)
    } else {
      setOfferValidated(false)
    }

    return () => {
      if (offerTypingTimeoutRef.current) {
        clearTimeout(offerTypingTimeoutRef.current)
      }
    }
  }, [offerSkill.name, offerSkill.experienceLevel, offerSkill.timeCommitment])

  useEffect(() => {
    if (wantTypingTimeoutRef.current) {
      clearTimeout(wantTypingTimeoutRef.current)
    }

    if (wantSkill.name && wantSkill.experienceLevel && wantSkill.timeCommitment) {
      wantTypingTimeoutRef.current = setTimeout(() => {
        setWantValidated(true)
      }, 1500)
    } else {
      setWantValidated(false)
    }

    return () => {
      if (wantTypingTimeoutRef.current) {
        clearTimeout(wantTypingTimeoutRef.current)
      }
    }
  }, [wantSkill.name, wantSkill.experienceLevel, wantSkill.timeCommitment])

  const handleOfferSkillChange = (field, value) => {
    setOfferSkill(prev => ({ ...prev, [field]: value }))
  }

  const handleWantSkillChange = (field, value) => {
    setWantSkill(prev => ({ ...prev, [field]: value }))
  }

  const getValueColor = (value) => {
    if (value >= 80) return 'bg-emerald-500'
    if (value >= 60) return 'bg-indigo-500'
    if (value >= 40) return 'bg-yellow-500'
    return 'bg-gray-300'
  }

  const getValueLabel = (value) => {
    if (value >= 80) return 'Excellent'
    if (value >= 60) return 'Good'
    if (value >= 40) return 'Fair'
    if (value > 0) return 'Basic'
    return 'Incomplete'
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">AI-Powered Skill Onboarding</h2>
        <p className="text-gray-500 mt-1">Enter your skills and let AI evaluate their exchange value in real-time</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* What I Offer Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900">What I Offer</h3>
            {offerValidated && (
              <div className="ml-auto flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Validated by AI
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Skill Name */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Skill Name
              </label>
              <input
                type="text"
                value={offerSkill.name}
                onChange={(e) => handleOfferSkillChange('name', e.target.value)}
                placeholder="e.g., React Development, UI/UX Design"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Experience Level
              </label>
              <select
                value={offerSkill.experienceLevel}
                onChange={(e) => handleOfferSkillChange('experienceLevel', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select level</option>
                <option value="Junior">Junior</option>
                <option value="Mid">Mid</option>
                <option value="Senior">Senior</option>
              </select>
            </div>

            {/* Time Commitment */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Time Commitment (hours/week)
              </label>
              <input
                type="number"
                value={offerSkill.timeCommitment}
                onChange={(e) => handleOfferSkillChange('timeCommitment', e.target.value)}
                placeholder="e.g., 5, 10, 20"
                min="0"
                max="40"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Skill Value Meter */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-slate-900">Estimated Exchange Value</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-900">{offerValue}</span>
                  <span className="text-sm text-gray-500">/100</span>
                  <span className={`text-xs px-2 py-1 rounded ${getValueColor(offerValue)} text-white font-medium`}>
                    {getValueLabel(offerValue)}
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${getValueColor(offerValue)}`}
                  style={{ width: `${offerValue}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                AI evaluates based on skill relevance, experience level, and time commitment
              </p>
            </div>
          </div>
        </div>

        {/* What I Want to Learn Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Award className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900">What I Want to Learn</h3>
            {wantValidated && (
              <div className="ml-auto flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Validated by AI
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Skill Name */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Skill Name
              </label>
              <input
                type="text"
                value={wantSkill.name}
                onChange={(e) => handleWantSkillChange('name', e.target.value)}
                placeholder="e.g., Machine Learning, Graphic Design"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Target Experience Level
              </label>
              <select
                value={wantSkill.experienceLevel}
                onChange={(e) => handleWantSkillChange('experienceLevel', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select level</option>
                <option value="Junior">Junior</option>
                <option value="Mid">Mid</option>
                <option value="Senior">Senior</option>
              </select>
            </div>

            {/* Time Commitment */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Time Commitment (hours/week)
              </label>
              <input
                type="number"
                value={wantSkill.timeCommitment}
                onChange={(e) => handleWantSkillChange('timeCommitment', e.target.value)}
                placeholder="e.g., 5, 10, 20"
                min="0"
                max="40"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Skill Value Meter */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-slate-900">Estimated Exchange Value</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-900">{wantValue}</span>
                  <span className="text-sm text-gray-500">/100</span>
                  <span className={`text-xs px-2 py-1 rounded ${getValueColor(wantValue)} text-white font-medium`}>
                    {getValueLabel(wantValue)}
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${getValueColor(wantValue)}`}
                  style={{ width: `${wantValue}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                AI evaluates based on skill relevance, experience level, and time commitment
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          disabled={!offerValidated || !wantValidated}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium flex items-center gap-2"
        >
          <CheckCircle className="w-5 h-5" />
          Complete Skill Onboarding
        </button>
      </div>
    </div>
  )
}

export default SkillEntry

