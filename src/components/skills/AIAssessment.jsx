import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function AIAssessment({ skillName, onComplete, onCancel }) {
  const [loading, setLoading] = useState(false)
  const [loadingQuestions, setLoadingQuestions] = useState(true)
  const [step, setStep] = useState(1)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})

  // Fetch dynamic questions when component mounts
  useEffect(() => {
    fetchDynamicQuestions()
  }, [skillName])

  const fetchDynamicQuestions = async () => {
    setLoadingQuestions(true)
    
    try {
      // Ensure we have a valid session before calling the function
      let { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      // If no session or expired, try to refresh
      if (!session || sessionError) {
        console.log('⚠️ No session found, attempting refresh...')
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
        if (refreshedSession) {
          session = refreshedSession
          sessionError = null
        } else {
          sessionError = refreshError
        }
      }
      
      if (sessionError || !session) {
        console.error('❌ No valid session found:', sessionError)
        setQuestions(getFallbackQuestions())
        setLoadingQuestions(false)
        return
      }

      console.log('✅ Session found, calling function:', {
        userId: session.user.id,
        email: session.user.email,
        hasAccessToken: !!session.access_token,
        tokenExpiresAt: new Date(session.expires_at * 1000).toISOString()
      })

      // Get Supabase URL and anon key from environment
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      // Prepare the Authorization header with JWT token
      const authHeader = `Bearer ${session.access_token}`
      
      console.log('📤 Sending request with JWT:', {
        url: `${supabaseUrl}/functions/v1/assess-skill`,
        hasToken: !!session.access_token,
        tokenLength: session.access_token?.length || 0,
        tokenPrefix: session.access_token?.substring(0, 20) || 'none',
        authHeaderPrefix: authHeader.substring(0, 30)
      })

      // Call Edge Function directly with fetch - JWT is sent in Authorization header
      const response = await fetch(`${supabaseUrl}/functions/v1/assess-skill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader, // JWT sent here as "Bearer <token>"
          'apikey': supabaseAnonKey || '',
        },
        body: JSON.stringify({
          skillName,
          action: 'generate-questions',
          userId: session.user.id // Include user_id as fallback for verify_jwt=true
        })
      })

      let data = null
      let error = null

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Edge Function error response:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        })
        try {
          error = JSON.parse(errorText)
          console.error('❌ Parsed error:', error)
        } catch {
          error = { message: errorText || `HTTP ${response.status}` }
        }
      } else {
        data = await response.json()
      }

      if (error) {
        console.warn('⚠️ Failed to get dynamic questions, using fallback:', error)
        setQuestions(getFallbackQuestions())
      } else if (data && data.questions) {
        setQuestions(data.questions)
      } else {
        setQuestions(getFallbackQuestions())
      }
    } catch (error) {
      console.warn('Error fetching questions:', error)
      setQuestions(getFallbackQuestions())
    } finally {
      setLoadingQuestions(false)
    }
  }

  const getFallbackQuestions = () => {
    // Detect skill type from name (simple heuristic)
    const skillLower = skillName.toLowerCase()
    const isSport = ['badminton', 'tennis', 'basketball', 'soccer', 'football', 'volleyball', 'swimming', 'yoga', 'gym', 'fitness', 'running', 'cycling', 'dancing', 'martial', 'karate', 'boxing'].some(s => skillLower.includes(s))
    const isLanguage = ['spanish', 'french', 'german', 'chinese', 'japanese', 'korean', 'italian', 'portuguese', 'russian', 'arabic', 'hindi'].some(s => skillLower.includes(s))
    const isCreative = ['music', 'guitar', 'piano', 'singing', 'art', 'drawing', 'painting', 'photography', 'writing', 'poetry'].some(s => skillLower.includes(s))
    
    if (isSport) {
      return [
        {
          id: 'q1',
          question: `Describe your experience with ${skillName}. How long have you been practicing and what level do you play at?`,
          type: 'text',
          placeholder: 'Share your playing experience and skill level...',
        },
        {
          id: 'q2',
          question: `What ${skillName} techniques and skills are you most comfortable with?`,
          type: 'text',
          placeholder: 'Describe the techniques you can perform...',
        },
        {
          id: 'q3',
          question: `Have you participated in any ${skillName} matches, competitions, or regular practice sessions? Describe your experience.`,
          type: 'text',
          placeholder: 'Share your competitive or practice experience...',
        },
        {
          id: 'q4',
          question: `How would you help someone learn ${skillName}? What would you focus on teaching first?`,
          type: 'text',
          placeholder: 'Explain your teaching approach...',
        },
      ]
    } else if (isLanguage) {
      return [
        {
          id: 'q1',
          question: `Describe your ${skillName} speaking ability. How comfortable are you having conversations?`,
          type: 'text',
          placeholder: 'Share your speaking proficiency...',
        },
        {
          id: 'q2',
          question: `What contexts have you used ${skillName} in? (travel, work, study, etc.)`,
          type: 'text',
          placeholder: 'Describe where and how you use this language...',
        },
        {
          id: 'q3',
          question: `How would you rate your reading and writing skills in ${skillName}?`,
          type: 'text',
          placeholder: 'Describe your reading and writing abilities...',
        },
        {
          id: 'q4',
          question: `How would you help someone learn ${skillName}? What approach would you take?`,
          type: 'text',
          placeholder: 'Explain your teaching method...',
        },
      ]
    } else if (isCreative) {
      return [
        {
          id: 'q1',
          question: `Describe your experience with ${skillName}. What styles or genres do you work with?`,
          type: 'text',
          placeholder: 'Share your creative experience...',
        },
        {
          id: 'q2',
          question: `What ${skillName} techniques are you comfortable with?`,
          type: 'text',
          placeholder: 'Describe the techniques you use...',
        },
        {
          id: 'q3',
          question: `Have you created or performed any ${skillName} work? Share your experience.`,
          type: 'text',
          placeholder: 'Describe your creations or performances...',
        },
        {
          id: 'q4',
          question: `How would you teach someone ${skillName}? What would you start with?`,
          type: 'text',
          placeholder: 'Explain your teaching approach...',
        },
      ]
    } else {
      // Generic fallback for other skills
      return [
        {
          id: 'q1',
          question: `Describe your experience with ${skillName}. How long have you been practicing?`,
          type: 'text',
          placeholder: 'Share your experience with this skill...',
        },
        {
          id: 'q2',
          question: `What aspects of ${skillName} are you most comfortable with?`,
          type: 'text',
          placeholder: 'Describe your strengths and abilities...',
        },
        {
          id: 'q3',
          question: `Share a specific example of how you've used ${skillName} in practice.`,
          type: 'text',
          placeholder: 'Describe a practical application...',
        },
        {
          id: 'q4',
          question: `How would you help someone learn ${skillName}? What would you focus on?`,
          type: 'text',
          placeholder: 'Explain your teaching approach...',
        },
      ]
    }
  }

  const handleAnswer = (questionId, value) => {
    setAnswers({ ...answers, [questionId]: value })
  }

  const handleNext = () => {
    if (step < questions.length) {
      setStep(step + 1)
    }
  }

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const calculateFallbackAssessment = () => {
    // Fallback calculation if Gemini fails - analyze text responses
    let level = 'beginner'
    let difficulty = 30
    let explanation = ''
    
    // Get all answer values (text responses)
    const answerTexts = Object.values(answers).filter((v) => typeof v === 'string' && v.trim().length > 0)
    const totalLength = answerTexts.reduce((sum, text) => sum + text.length, 0)
    const avgLength = answerTexts.length > 0 ? totalLength / answerTexts.length : 0
    
    // Simple heuristics based on response length and number of responses
    if (answerTexts.length === 0 || avgLength < 50) {
      difficulty = 30
      level = 'beginner'
      explanation = `Based on your responses, you're at a beginner level with ${skillName}. You have foundational knowledge and are building your skills through practice.`
    } else if (avgLength < 150) {
      difficulty = 50
      level = 'intermediate'
      explanation = `Based on your responses, you're at an intermediate level with ${skillName}. You have solid experience and can work independently on most tasks.`
    } else if (avgLength < 300) {
      difficulty = 70
      level = 'advanced'
      explanation = `Based on your responses, you're at an advanced level with ${skillName}. You have extensive experience and can mentor others effectively.`
    } else {
      difficulty = 85
      level = 'advanced'
      explanation = `Based on your responses, you're at an advanced level with ${skillName}. You demonstrate deep expertise and can mentor others effectively.`
    }

    const summary = answerTexts.length > 0 
      ? `Based on your ${answerTexts.length} detailed response${answerTexts.length > 1 ? 's' : ''}, you've shared your knowledge and experience with ${skillName}.`
      : 'Limited responses provided.'

    return { level, difficulty, explanation, summary }
  }

  const handleSubmit = async () => {
    setLoading(true)
    
    try {
      // Ensure we have a valid session before calling the function
      let { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      // If no session or expired, try to refresh
      if (!session || sessionError) {
        console.log('⚠️ No session found, attempting refresh...')
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
        if (refreshedSession) {
          session = refreshedSession
          sessionError = null
        } else {
          sessionError = refreshError
        }
      }
      
      if (sessionError || !session) {
        console.error('❌ No valid session found:', sessionError)
        await new Promise(resolve => setTimeout(resolve, 1000))
        const assessment = calculateFallbackAssessment()
        setLoading(false)
        onComplete(assessment)
        return
      }

      console.log('✅ Session found for assessment:', {
        userId: session.user.id,
        hasAccessToken: !!session.access_token,
        tokenExpiresAt: new Date(session.expires_at * 1000).toISOString()
      })

      // Get Supabase URL and anon key from environment
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      // Prepare the Authorization header with JWT token
      const authHeader = `Bearer ${session.access_token}`
      
      console.log('📤 Sending assessment request with JWT:', {
        url: `${supabaseUrl}/functions/v1/assess-skill`,
        hasToken: !!session.access_token,
        tokenLength: session.access_token?.length || 0,
        tokenPrefix: session.access_token?.substring(0, 20) || 'none',
        authHeaderPrefix: authHeader.substring(0, 30)
      })

      // Call Edge Function directly with fetch - JWT is sent in Authorization header
      const response = await fetch(`${supabaseUrl}/functions/v1/assess-skill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader, // JWT sent here as "Bearer <token>"
          'apikey': supabaseAnonKey || '',
        },
        body: JSON.stringify({
          skillName,
          answers,
          questions, // Send questions back so server can evaluate correctness
          action: 'assess',
          userId: session.user.id // Include user_id as fallback for verify_jwt=true
        })
      })

      let data = null
      let error = null

      if (!response.ok) {
        const errorText = await response.text()
        try {
          error = JSON.parse(errorText)
        } catch {
          error = { message: errorText || `HTTP ${response.status}` }
        }
      } else {
        data = await response.json()
      }

      if (error) {
        console.warn('Gemini API failed, using fallback:', error)
        await new Promise(resolve => setTimeout(resolve, 1000))
        const assessment = calculateFallbackAssessment()
        setLoading(false)
        onComplete(assessment)
      } else {
        setLoading(false)
        onComplete(data)
      }
    } catch (error) {
      console.warn('Error calling assess-skill function:', error)
      await new Promise(resolve => setTimeout(resolve, 1000))
      const assessment = calculateFallbackAssessment()
      setLoading(false)
      onComplete(assessment)
    }
  }

  const currentQuestion = questions[step - 1]
  const currentAnswer = answers[currentQuestion?.id] || ''
  const allAnswered = Object.keys(answers).length === questions.length && 
                       Object.values(answers).every(a => typeof a === 'string' && a.trim().length > 0)
  const canProceed = currentAnswer.trim().length > 0

  if (loadingQuestions) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            🤖 AI Skill Assessment
          </h3>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating personalized questions for {skillName}...</p>
          <p className="text-sm text-gray-500 mt-2">Using AI to create general knowledge assessment</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          🤖 AI Skill Assessment
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {!loading ? (
        <>
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Question {step} of {questions.length}</span>
              <span>{Math.round((step / questions.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {currentQuestion && (
            <div className="space-y-4">
              <p className="font-medium text-gray-900 mb-4 text-lg">
                {currentQuestion.question}
              </p>
              <textarea
                value={currentAnswer}
                onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                placeholder={currentQuestion.placeholder || 'Type your response here...'}
                rows={6}
                className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-primary-600 focus:ring-2 focus:ring-primary-200 focus:outline-none resize-y min-h-[120px] text-gray-900 placeholder-gray-400"
              />
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{currentAnswer.length} characters</span>
                <span className={currentAnswer.trim().length < 20 ? 'text-orange-500' : 'text-gray-500'}>
                  {currentAnswer.trim().length < 20 ? 'Please provide more detail' : 'Good length'}
                </span>
              </div>
              
              {/* Navigation buttons */}
              <div className="flex gap-3 pt-2">
                {step > 1 && (
                  <button
                    onClick={handlePrevious}
                    className="btn btn-secondary flex-1"
                  >
                    ← Previous
                  </button>
                )}
                {step < questions.length ? (
                  <button
                    onClick={handleNext}
                    disabled={!canProceed}
                    className={`btn ${canProceed ? 'btn-primary' : 'btn-secondary opacity-50 cursor-not-allowed'} flex-1`}
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={!allAnswered}
                    className={`btn ${allAnswered ? 'btn-primary' : 'btn-secondary opacity-50 cursor-not-allowed'} flex-1`}
                  >
                    Get AI Assessment
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing your responses with AI...</p>
          <p className="text-sm text-gray-500 mt-2">Creating a summary and assessing your skill level</p>
        </div>
      )}
    </div>
  )
}

