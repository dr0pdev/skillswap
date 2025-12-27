import { useState, useEffect, useRef } from 'react'
import { CheckCircle, Sparkles, TrendingUp, Clock, Award, Tag, FileText, Brain, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'

const SkillEntry = () => {
  const [offerSkill, setOfferSkill] = useState({
    name: '',
    experienceLevel: '',
    timeCommitment: '',
    category: '',
    additionalNotes: '',
  })

  const [wantSkill, setWantSkill] = useState({
    name: '',
    experienceLevel: '',
    timeCommitment: '',
    category: '',
    additionalNotes: '',
  })

  const [offerValue, setOfferValue] = useState(0)
  const [wantValue, setWantValue] = useState(0)
  const [offerValidated, setOfferValidated] = useState(false)
  const [wantValidated, setWantValidated] = useState(false)
  const [showAIAssessment, setShowAIAssessment] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [assessmentAnswers, setAssessmentAnswers] = useState([])
  const [assessmentResult, setAssessmentResult] = useState(null)
  const [isAssessing, setIsAssessing] = useState(false)
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
      'Basic': 15,
      'Intermediate': 25,
      'Advanced': 30,
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

  const handleSubmitOffer = () => {
    if (offerValidated) {
      // Handle offer skill submission
      console.log('Submitting offer skill:', offerSkill)
      // You can add your submission logic here
      alert('Skill offer submitted successfully!')
    }
  }

  const handleSubmitWant = () => {
    if (wantValidated) {
      // Handle want skill submission
      console.log('Submitting want skill:', wantSkill)
      // You can add your submission logic here
      alert('Skill want submitted successfully!')
    }
  }

  const handleSubmitBoth = () => {
    if (offerValidated && wantValidated) {
      // Handle both submissions
      console.log('Submitting both skills:', { offer: offerSkill, want: wantSkill })
      // You can add your submission logic here
      alert('Both skills submitted successfully!')
    }
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

  // Generate AI questions based on skill and experience level
  const generateQuestions = () => {
    if (!offerSkill.name || !offerSkill.experienceLevel) {
      return []
    }

    const skillName = offerSkill.name.toLowerCase()
    const experienceLevel = offerSkill.experienceLevel
    const questions = []

    // Basic questions for all levels
    questions.push({
      id: 1,
      question: `What is your primary use case or application of ${offerSkill.name}?`,
      type: 'text',
      expectedLength: experienceLevel === 'Advanced' ? 'detailed' : experienceLevel === 'Intermediate' ? 'moderate' : 'brief'
    })

    questions.push({
      id: 2,
      question: `How long have you been working with ${offerSkill.name}?`,
      type: 'text',
      expectedLength: 'brief'
    })

    // Experience level specific questions
    if (experienceLevel === 'Advanced') {
      questions.push({
        id: 3,
        question: `Can you describe a complex project or challenge you've solved using ${offerSkill.name}?`,
        type: 'text',
        expectedLength: 'detailed'
      })
      questions.push({
        id: 4,
        question: `What advanced concepts or techniques in ${offerSkill.name} are you most comfortable with?`,
        type: 'text',
        expectedLength: 'detailed'
      })
      questions.push({
        id: 5,
        question: `Have you mentored others or contributed to ${offerSkill.name} community (open source, forums, etc.)?`,
        type: 'text',
        expectedLength: 'moderate'
      })
    } else if (experienceLevel === 'Intermediate') {
      questions.push({
        id: 3,
        question: `Describe a project where you used ${offerSkill.name} and what you learned from it.`,
        type: 'text',
        expectedLength: 'moderate'
      })
      questions.push({
        id: 4,
        question: `What are the main tools or frameworks you use with ${offerSkill.name}?`,
        type: 'text',
        expectedLength: 'moderate'
      })
    } else { // Basic
      questions.push({
        id: 3,
        question: `What resources or courses have you used to learn ${offerSkill.name}?`,
        type: 'text',
        expectedLength: 'brief'
      })
      questions.push({
        id: 4,
        question: `What is one thing you can do with ${offerSkill.name}?`,
        type: 'text',
        expectedLength: 'brief'
      })
    }

    return questions
  }

  const [assessmentQuestions, setAssessmentQuestions] = useState([])

  const startAIAssessment = () => {
    if (!offerSkill.name || !offerSkill.experienceLevel) {
      alert('Please fill in Skill Name and Experience Level before starting AI Assessment')
      return
    }
    const questions = generateQuestions()
    setAssessmentQuestions(questions)
    setCurrentQuestionIndex(0)
    setAssessmentAnswers(new Array(questions.length).fill(''))
    setAssessmentResult(null)
    setShowAIAssessment(true)
  }

  const handleAnswerChange = (value) => {
    const newAnswers = [...assessmentAnswers]
    newAnswers[currentQuestionIndex] = value
    setAssessmentAnswers(newAnswers)
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < assessmentQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // All questions answered, assess now
      assessAnswers()
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const assessAnswers = async () => {
    setIsAssessing(true)
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000))

    const claimedLevel = offerSkill.experienceLevel
    let score = 0
    const feedback = []
    const strengths = []
    const concerns = []

    // Assess each answer
    assessmentAnswers.forEach((answer, index) => {
      const question = assessmentQuestions[index]
      const answerLength = answer.trim().length

      if (question.expectedLength === 'detailed' && answerLength < 100) {
        concerns.push(`Question ${index + 1}: Answer seems too brief for ${claimedLevel} level`)
        score += 10
      } else if (question.expectedLength === 'moderate' && answerLength < 50) {
        concerns.push(`Question ${index + 1}: Answer could be more detailed`)
        score += 15
      } else if (question.expectedLength === 'brief' && answerLength < 20) {
        concerns.push(`Question ${index + 1}: Answer is too short`)
        score += 10
      } else {
        strengths.push(`Question ${index + 1}: Well-answered`)
        score += 25
      }

      // Check for relevant keywords based on skill
      const skillKeywords = offerSkill.name.toLowerCase().split(' ')
      const hasRelevantContent = skillKeywords.some(keyword => 
        answer.toLowerCase().includes(keyword) || answerLength > 30
      )
      
      if (hasRelevantContent) {
        score += 5
      }
    })

    // Overall assessment
    const averageScore = score / assessmentQuestions.length
    const isValid = averageScore >= 60

    let levelMatch = 'matches'
    if (claimedLevel === 'Advanced' && averageScore < 70) {
      levelMatch = 'may not match'
      concerns.push('Your answers suggest your experience might be closer to Intermediate level')
    } else if (claimedLevel === 'Intermediate' && averageScore < 50) {
      levelMatch = 'may not match'
      concerns.push('Your answers suggest your experience might be closer to Basic level')
    } else if (claimedLevel === 'Basic' && averageScore > 80) {
      levelMatch = 'exceeds'
      strengths.push('Your answers suggest you might have Intermediate or higher experience')
    }

    if (isValid) {
      feedback.push(`Your answers validate your ${claimedLevel} experience level claim`)
    } else {
      feedback.push(`Your answers need more detail to fully validate your ${claimedLevel} experience level`)
    }

    setAssessmentResult({
      isValid,
      score: Math.round(averageScore),
      levelMatch,
      claimedLevel,
      feedback,
      strengths,
      concerns
    })

    setIsAssessing(false)
  }

  const resetAssessment = () => {
    setShowAIAssessment(false)
    setCurrentQuestionIndex(0)
    setAssessmentAnswers([])
    setAssessmentResult(null)
    setAssessmentQuestions([])
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-[#0C243D] mt-1">AI-Powered Skill Onboarding</h2>
        <p className="text-[#0C243D] mt-1">Enter your skills and let AI evaluate their exchange value in real-time</p>
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

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Category
              </label>
              <select
                value={offerSkill.category}
                onChange={(e) => handleOfferSkillChange('category', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select category</option>
                <option value="Development">Development</option>
                <option value="Design">Design</option>
                <option value="Data Science">Data Science</option>
                <option value="Marketing">Marketing</option>
                <option value="Business">Business</option>
                <option value="Language">Language</option>
                <option value="Creative">Creative</option>
                <option value="Other">Other</option>
              </select>
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
                <option value="Basic">Basic</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
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

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Additional Notes (Optional)
              </label>
              <textarea
                value={offerSkill.additionalNotes}
                onChange={(e) => handleOfferSkillChange('additionalNotes', e.target.value)}
                placeholder="Add any additional information about this skill..."
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
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

            {/* Submit Button for Offer */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleSubmitOffer}
                disabled={!offerValidated}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Submit Skill Offer
              </button>
            </div>
          </div>
        </div>

        {/* AI Assessment Section */}
        {offerSkill.name && offerSkill.experienceLevel && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">AI Assessment</h3>
                  <p className="text-sm text-gray-500">Answer questions to validate your experience level</p>
                </div>
              </div>
              {!showAIAssessment && (
                <button
                  onClick={startAIAssessment}
                  className="px-4 py-2 text-sm text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                  style={{ backgroundColor: '#27496A' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e3a52'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#27496A'}
                >
                  <Brain className="w-4 h-4" />
                  Start Assessment
                </button>
              )}
            </div>

            {showAIAssessment && !assessmentResult && (
              <div className="space-y-6">
                {/* Progress Indicator */}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600">
                    Question {currentQuestionIndex + 1} of {assessmentQuestions.length}
                  </p>
                  <div className="flex-1 mx-4 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentQuestionIndex + 1) / assessmentQuestions.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Current Question */}
                {assessmentQuestions[currentQuestionIndex] && (
                  <div className="space-y-4">
                    <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                      <div className="flex items-start gap-3">
                        <Brain className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900 mb-2">
                            {assessmentQuestions[currentQuestionIndex].question}
                          </p>
                          <p className="text-xs text-gray-500">
                            Expected answer length: {assessmentQuestions[currentQuestionIndex].expectedLength}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Answer Input */}
                    <div>
                      <textarea
                        value={assessmentAnswers[currentQuestionIndex] || ''}
                        onChange={(e) => handleAnswerChange(e.target.value)}
                        placeholder="Type your answer here..."
                        rows="6"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                      />
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <button
                        onClick={handlePreviousQuestion}
                        disabled={currentQuestionIndex === 0}
                        className="px-4 py-2 text-sm border border-gray-300 text-slate-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={handleNextQuestion}
                        disabled={!assessmentAnswers[currentQuestionIndex] || assessmentAnswers[currentQuestionIndex].trim().length === 0}
                        className="px-6 py-2 text-sm text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        style={{ backgroundColor: '#27496A' }}
                        onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#1e3a52')}
                        onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#27496A')}
                      >
                        {currentQuestionIndex === assessmentQuestions.length - 1 ? 'Submit & Assess' : 'Next'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Cancel Button */}
                <div className="text-center">
                  <button
                    onClick={resetAssessment}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel Assessment
                  </button>
                </div>
              </div>
            )}

            {/* Assessment Results */}
            {isAssessing && (
              <div className="text-center py-12">
                <div className="inline-block w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 font-medium">AI is assessing your answers...</p>
                <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
              </div>
            )}

            {assessmentResult && !isAssessing && (
              <div className="space-y-6">
                {/* Overall Result */}
                <div className="p-6 rounded-lg border-2" style={{ 
                  borderColor: assessmentResult.isValid ? '#10b981' : '#ef4444',
                  backgroundColor: assessmentResult.isValid ? '#f0fdf4' : '#fef2f2'
                }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {assessmentResult.isValid ? (
                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                      ) : (
                        <XCircle className="w-8 h-8 text-red-600" />
                      )}
                      <div>
                        <p className="font-bold text-lg text-slate-900">
                          {assessmentResult.isValid ? 'Assessment Passed' : 'Assessment Needs Improvement'}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Your answers {assessmentResult.levelMatch} your claimed {assessmentResult.claimedLevel} experience level
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold" style={{ color: assessmentResult.isValid ? '#10b981' : '#ef4444' }}>
                        {assessmentResult.score}%
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Score</p>
                    </div>
                  </div>
                </div>

                {/* Feedback */}
                {assessmentResult.feedback.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">Assessment Feedback</h4>
                    <div className="space-y-2">
                      {assessmentResult.feedback.map((item, index) => (
                        <div key={index} className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                          <p className="text-sm text-slate-700">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths */}
                {assessmentResult.strengths.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      Strengths
                    </h4>
                    <ul className="space-y-2">
                      {assessmentResult.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50">
                          <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-slate-700">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Concerns */}
                {assessmentResult.concerns.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                      Areas for Improvement
                    </h4>
                    <ul className="space-y-2">
                      {assessmentResult.concerns.map((concern, index) => (
                        <li key={index} className="flex items-start gap-2 p-3 rounded-lg bg-amber-50">
                          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-slate-700">{concern}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <button
                    onClick={resetAssessment}
                    className="px-4 py-2 text-sm border border-gray-300 text-slate-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={startAIAssessment}
                    className="px-6 py-2 text-sm text-white rounded-lg transition-colors font-medium"
                    style={{ backgroundColor: '#27496A' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e3a52'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#27496A'}
                  >
                    Retake Assessment
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

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

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Category
              </label>
              <select
                value={wantSkill.category}
                onChange={(e) => handleWantSkillChange('category', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select category</option>
                <option value="Development">Development</option>
                <option value="Design">Design</option>
                <option value="Data Science">Data Science</option>
                <option value="Marketing">Marketing</option>
                <option value="Business">Business</option>
                <option value="Language">Language</option>
                <option value="Creative">Creative</option>
                <option value="Other">Other</option>
              </select>
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
                <option value="Basic">Basic</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
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

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Additional Notes (Optional)
              </label>
              <textarea
                value={wantSkill.additionalNotes}
                onChange={(e) => handleWantSkillChange('additionalNotes', e.target.value)}
                placeholder="Add any additional information about this skill..."
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
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

            {/* Submit Button for Want */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleSubmitWant}
                disabled={!wantValidated}
                className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Submit Skill Want
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Both Button (Optional) */}
      {(offerValidated && wantValidated) && (
        <div className="flex justify-center">
          <button
            onClick={handleSubmitBoth}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Submit Both Skills
          </button>
        </div>
      )}
    </div>
  )
}

export default SkillEntry

