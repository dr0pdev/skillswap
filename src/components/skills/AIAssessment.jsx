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
    return [
      {
        id: 'experience',
        question: `How long have you been practicing ${skillName}?`,
        options: [
          { value: 'less-than-6-months', label: 'Less than 6 months' },
          { value: '6-months-to-2-years', label: '6 months to 2 years' },
          { value: '2-to-5-years', label: '2 to 5 years' },
          { value: 'more-than-5-years', label: 'More than 5 years' },
        ],
      },
      {
        id: 'projects',
        question: `How many projects or real-world applications have you completed with ${skillName}?`,
        options: [
          { value: 'none', label: 'None yet, still learning basics' },
          { value: '1-3', label: '1-3 projects' },
          { value: '4-10', label: '4-10 projects' },
          { value: 'more-than-10', label: 'More than 10 projects' },
        ],
      },
      {
        id: 'comfort',
        question: `How comfortable are you teaching ${skillName} to others?`,
        options: [
          { value: 'beginner', label: 'I can teach basic concepts' },
          { value: 'intermediate', label: 'I can teach intermediate techniques' },
          { value: 'advanced', label: 'I can teach advanced topics and best practices' },
          { value: 'expert', label: 'I can mentor at a professional level' },
        ],
      },
      {
        id: 'time',
        question: `How often do you currently use ${skillName}?`,
        options: [
          { value: 'rarely', label: 'Rarely / Not recently' },
          { value: 'monthly', label: 'A few times a month' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'daily', label: 'Daily or near-daily' },
        ],
      },
    ]
  }

  const handleAnswer = (questionId, value) => {
    setAnswers({ ...answers, [questionId]: value })
    if (step < questions.length) {
      setTimeout(() => setStep(step + 1), 300)
    }
  }

  const calculateFallbackAssessment = () => {
    // Fallback calculation if Gemini fails
    let level = 'beginner'
    let difficulty = 30
    let explanation = ''

    const expScore = {
      'less-than-6-months': 10,
      '6-months-to-2-years': 30,
      '2-to-5-years': 60,
      'more-than-5-years': 90,
    }[answers.experience] || 10

    const projScore = {
      'none': 10,
      '1-3': 35,
      '4-10': 65,
      'more-than-10': 90,
    }[answers.projects] || 10

    const comfortScore = {
      'beginner': 25,
      'intermediate': 50,
      'advanced': 75,
      'expert': 95,
    }[answers.comfort] || 25

    const timeScore = {
      'rarely': 15,
      'monthly': 35,
      'weekly': 65,
      'daily': 90,
    }[answers.time] || 15

    difficulty = Math.round(
      expScore * 0.3 + projScore * 0.3 + comfortScore * 0.25 + timeScore * 0.15
    )

    if (difficulty < 35) {
      level = 'beginner'
      explanation = `Based on your responses, you're at a beginner level with ${skillName}. You have foundational knowledge and are building your skills through practice.`
    } else if (difficulty < 70) {
      level = 'intermediate'
      explanation = `Based on your responses, you're at an intermediate level with ${skillName}. You have solid experience and can work independently on most tasks.`
    } else {
      level = 'advanced'
      explanation = `Based on your responses, you're at an advanced level with ${skillName}. You have extensive experience and can mentor others effectively.`
    }

    return { level, difficulty, explanation }
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
  const allAnswered = Object.keys(answers).length === questions.length && 
                       Object.values(answers).every(a => a !== '' && a !== undefined)

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
          <p className="text-sm text-gray-500 mt-2">Using AI to create skill-specific assessment</p>
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
            <div className="space-y-3">
              <p className="font-medium text-gray-900 mb-4">
                {currentQuestion.question}
              </p>
              {currentQuestion.options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleAnswer(currentQuestion.id, option.value)}
                  className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
                    answers[currentQuestion.id] === option.value
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {allAnswered && (
            <button
              onClick={handleSubmit}
              className="btn btn-primary w-full mt-6"
            >
              Get AI Assessment
            </button>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing your responses with AI...</p>
        </div>
      )}
    </div>
  )
}

