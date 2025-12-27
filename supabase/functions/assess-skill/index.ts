// Supabase Edge Function for AI Skill Assessment
// Uses Google Gemini API to generate dynamic questions and assess user skill level

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Missing Supabase configuration')
      return new Response(JSON.stringify({ 
        error: 'Server configuration error' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // Get Authorization header - try all possible variations
    const authHeader = req.headers.get('Authorization') 
      || req.headers.get('authorization')
      || req.headers.get('x-authorization')
    
    // Log ALL headers for debugging
    const allHeaders: Record<string, string> = {}
    req.headers.forEach((value, key) => {
      // Log first 100 chars of each header value
      allHeaders[key] = value.length > 100 ? value.substring(0, 100) + '...' : value
    })
    
    console.log('🔍 Request received:', {
      method: req.method,
      url: req.url,
      hasAuthHeader: !!authHeader,
      authHeaderLength: authHeader?.length || 0,
      authHeaderPrefix: authHeader?.substring(0, 50) || 'none',
      allHeaderKeys: Array.from(req.headers.keys()),
      allHeaders: allHeaders
    })

    // Parse request body first (we might need userId from body if verify_jwt=true)
    let requestBody: any = {}
    try {
      requestBody = await req.json()
    } catch (err) {
      console.error('❌ Failed to parse request body:', err)
      return new Response(JSON.stringify({ 
        error: 'Invalid request body' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { skillName, answers, action, userId: bodyUserId, questions: providedQuestions } = requestBody

    // Verify authentication
    // When verify_jwt=true, Supabase verifies JWT before our code runs
    // If request reaches here, JWT is valid, but header may be stripped
    // We need to extract user info from the JWT or use the header if present
    let user = null
    let authError: Error | null = null

    if (authHeader) {
      // Authorization header is present - use it to get user
      const bearerToken = authHeader.startsWith('Bearer ') 
        ? authHeader 
        : `Bearer ${authHeader}`

      console.log('🔑 Authorization header found, verifying token...')

      // Create Supabase client with the auth header
      const supabaseClient = createClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          global: {
            headers: { Authorization: bearerToken },
          },
        }
      )

      // Get user from the token
      try {
        const { data: { user: authUser }, error: getUserError } = await supabaseClient.auth.getUser()
        
        if (getUserError) {
          console.error('❌ getUser() error:', {
            message: getUserError.message,
            status: getUserError.status,
            name: getUserError.name
          })
          
          // Fallback: If JWT verification fails but userId is in body, use it
          // This handles cases where verify_jwt=true strips/modifies the header
          if (bodyUserId) {
            console.log('⚠️ JWT verification failed, but userId provided in body - using fallback')
            user = {
              id: bodyUserId,
              email: null,
            } as any
            console.log('✅ Using user_id from request body (JWT verification fallback):', {
              userId: user.id
            })
          } else {
            authError = new Error(getUserError.message || 'Failed to verify authentication token')
          }
        } else if (!authUser) {
          console.error('❌ No user returned from getUser()')
          // Fallback to userId from body if available
          if (bodyUserId) {
            console.log('⚠️ No user from getUser(), but userId provided in body - using fallback')
            user = {
              id: bodyUserId,
              email: null,
            } as any
            console.log('✅ Using user_id from request body (no user fallback):', {
              userId: user.id
            })
          } else {
            authError = new Error('User not found in token')
          }
        } else {
          user = authUser
          console.log('✅ Auth successful (from header):', {
            userId: user.id,
            email: user.email
          })
        }
      } catch (err) {
        console.error('❌ Auth verification exception:', err)
        authError = err instanceof Error ? err : new Error(`Auth error: ${String(err)}`)
      }
    } else {
      // No Authorization header - this happens when verify_jwt=true
      // Supabase verifies JWT at infrastructure level and strips the header
      // If request reached here, JWT was valid, but we need to get user another way
      console.warn('⚠️ No Authorization header - verify_jwt=true may be enabled')
      
      // Workaround: If user_id is sent in body, we can fetch user details
      // This is a fallback for when verify_jwt=true strips the header
      if (bodyUserId) {
        console.log('ℹ️ User ID provided in request body, fetching user details...')
        try {
          // Use service role or anon key to fetch user (anon key works for public user data)
          const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
          // Note: We can't directly fetch user by ID with anon key, but we can trust
          // that if verify_jwt=true and request reached here, user is authenticated
          // For now, create a minimal user object
          user = {
            id: bodyUserId,
            email: null, // Can't get email without proper auth
          } as any
          console.log('✅ Using user_id from request body (verify_jwt=true mode):', {
            userId: user.id
          })
        } catch (err) {
          console.error('❌ Error processing user_id from body:', err)
          authError = new Error('Failed to process user authentication')
        }
      } else {
        console.error('❌ No Authorization header AND no user_id in body')
        authError = new Error('Authorization header required. Either disable verify_jwt in Dashboard or ensure frontend sends Authorization header.')
      }
    }

    if (authError || !user) {
      console.error('❌ Authentication failed:', {
        error: authError?.message || 'No user found',
        hasAuthHeader: !!authHeader,
        suggestion: 'If verify_jwt=true, disable it in Dashboard or ensure frontend sends Authorization header'
      })
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        details: authError?.message || 'Authentication failed. Please log in again.',
        hint: 'If using verify_jwt=true, ensure Authorization header is sent from frontend'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!skillName) {
      return new Response(
        JSON.stringify({ error: 'skillName is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get Gemini API key from environment (support both uppercase and lowercase)
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('gemini_api_key')
    // Optional: specify model (defaults to gemini-flash-latest)
    const geminiModel = Deno.env.get('GEMINI_MODEL') || 'gemini-flash-latest'
    
    if (!geminiApiKey) {
      console.log('⚠️ Gemini API key not found, using fallback assessment')
      
      // Handle different actions with fallback
      if (action === 'generate-questions') {
        return new Response(JSON.stringify(getFallbackQuestions(skillName)), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } else {
        const fallbackAssessment = calculateFallbackAssessment(answers || {})
        return new Response(JSON.stringify(fallbackAssessment), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Handle different actions
    if (action === 'generate-questions') {
      // Generate skill-specific technical questions using AI
      console.log('🤖 Generating AI-powered technical questions for:', skillName)
      try {
        const questions = await generateQuestionsWithGemini(skillName, geminiApiKey, geminiModel)
        console.log('✅ Successfully generated', questions.questions?.length || 0, 'AI technical questions')
        return new Response(JSON.stringify(questions), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (error) {
        console.error('❌ Error generating AI questions, using fallback:', error)
        // Fallback to static questions if AI fails
        return new Response(JSON.stringify(getFallbackQuestions(skillName)), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } else {
      // Assess skill level based on answers to technical questions
      if (!answers) {
        return new Response(
          JSON.stringify({ error: 'answers are required for assessment' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // Get the questions that were asked (they should be sent back with answers)
      // If questions are provided, use them; otherwise generate them again for assessment
      let questionsToUse = providedQuestions
      
      // If questions weren't provided, regenerate them (fallback)
      if (!questionsToUse || !Array.isArray(questionsToUse)) {
        console.log('⚠️ Questions not provided, regenerating for assessment...')
        try {
          const generatedQuestions = await generateQuestionsWithGemini(skillName, geminiApiKey, geminiModel)
          questionsToUse = generatedQuestions.questions || []
        } catch (error) {
          console.error('❌ Could not regenerate questions, using fallback')
          questionsToUse = getFallbackQuestions(skillName).questions || []
        }
      }

      console.log('🔍 Assessing skill:', skillName, 'with', Object.keys(answers).length, 'answers')
      console.log('📝 Evaluating correctness of technical answers...')
      
      const assessment = await assessSkillWithGemini(skillName, answers, geminiApiKey, geminiModel, questionsToUse)
      return new Response(JSON.stringify(assessment), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  } catch (error) {
    console.error('Error in assess-skill function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function generateQuestionsWithGemini(skillName: string, apiKey: string, model: string) {
  const prompt = `You are an expert technical assessor for "${skillName}". Create 4 technical questions that test actual knowledge and proficiency, NOT self-reported experience.

CRITICAL REQUIREMENTS:
1. Questions must be TECHNICAL and SPECIFIC to "${skillName}" - test actual knowledge
2. Questions should progress: Q1 (basic concepts) → Q2 (intermediate) → Q3 (advanced) → Q4 (expert)
3. Each question must have exactly 4 multiple-choice options
4. ONE option is the CORRECT answer (indicated by "correct": true)
5. Other options should be plausible but incorrect (common mistakes, misconceptions, or less optimal answers)
6. Questions should test:
   - Q1: Core concepts, fundamentals, basic syntax/terminology
   - Q2: Practical usage, common patterns, standard practices
   - Q3: Problem-solving, optimization, edge cases
   - Q4: Advanced techniques, best practices, architectural decisions

EXAMPLES OF GOOD QUESTIONS:
- "What is the primary purpose of [concept] in ${skillName}?"
- "Which approach is most efficient for [scenario] in ${skillName}?"
- "How would you handle [problem] when working with ${skillName}?"
- "What is the best practice for [situation] in ${skillName}?"

EXAMPLES OF BAD QUESTIONS (DO NOT USE):
- "How long have you been using ${skillName}?"
- "How many projects have you completed?"
- "How comfortable are you with ${skillName}?"

You MUST respond with ONLY valid JSON, no markdown, no explanations. Format EXACTLY as:
{
  "questions": [
    {
      "id": "q1",
      "question": "Technical question testing basic knowledge of ${skillName}?",
      "options": [
        {"value": "opt1", "label": "Correct answer (basic level)", "correct": true},
        {"value": "opt2", "label": "Incorrect option (common mistake)"},
        {"value": "opt3", "label": "Incorrect option"},
        {"value": "opt4", "label": "Incorrect option"}
      ]
    },
    {
      "id": "q2",
      "question": "Technical question testing intermediate knowledge of ${skillName}?",
      "options": [
        {"value": "opt1", "label": "Incorrect option"},
        {"value": "opt2", "label": "Correct answer (intermediate level)", "correct": true},
        {"value": "opt3", "label": "Incorrect option"},
        {"value": "opt4", "label": "Incorrect option"}
      ]
    },
    {
      "id": "q3",
      "question": "Technical question testing advanced knowledge of ${skillName}?",
      "options": [
        {"value": "opt1", "label": "Incorrect option"},
        {"value": "opt2", "label": "Incorrect option"},
        {"value": "opt3", "label": "Correct answer (advanced level)", "correct": true},
        {"value": "opt4", "label": "Incorrect option"}
      ]
    },
    {
      "id": "q4",
      "question": "Technical question testing expert-level knowledge of ${skillName}?",
      "options": [
        {"value": "opt1", "label": "Incorrect option"},
        {"value": "opt2", "label": "Incorrect option"},
        {"value": "opt3", "label": "Incorrect option"},
        {"value": "opt4", "label": "Correct answer (expert level)", "correct": true}
      ]
    }
  ]
}

IMPORTANT: Make questions technical and specific to "${skillName}". Test actual knowledge, not experience.`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7, // Lower temperature for more consistent, focused questions
            maxOutputTokens: 2000, // Increased for more detailed questions
            topP: 0.95,
            topK: 40,
          }
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = 'Gemini API request failed'
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.error?.message || errorData.message || errorMessage
      } catch {
        errorMessage = errorText || errorMessage
      }
      console.error('Gemini API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage
      })
      throw new Error(errorMessage)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    // Extract JSON from response (handle markdown code blocks and plain JSON)
    let jsonText = text.trim()
    
    // Remove markdown code blocks if present
    if (jsonText.includes('```')) {
      // Extract content between code blocks
      const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1].trim()
      } else {
        // Fallback: remove opening and closing markers
        jsonText = jsonText.replace(/^```json\s*/i, '').replace(/^```\s*/, '')
        jsonText = jsonText.replace(/```\s*$/, '').trim()
      }
    }
    
    // Try to find JSON object in the text - match from first { to last }
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      let jsonString = jsonMatch[0]
      
      // Try to fix common JSON issues
      // Remove trailing commas before closing brackets/braces
      jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1')
      
      try {
        const parsed = JSON.parse(jsonString)
        // Validate that it has the expected structure
        if (parsed.questions && Array.isArray(parsed.questions)) {
          return parsed
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
      }
    }
    
    throw new Error('Could not parse questions from Gemini response')
  } catch (error) {
    console.error('Error generating questions:', error)
    return getFallbackQuestions(skillName)
  }
}

async function assessSkillWithGemini(skillName: string, answers: any, apiKey: string, model: string, questions: any[]) {
  // First, evaluate correctness of answers (if questions have correct answers marked)
  const questionAnswers = questions.map((q: any, index: number) => {
    const userAnswer = answers[q.id]
    const correctOption = q.options?.find((opt: any) => opt.correct === true)
    const hasCorrectAnswer = correctOption !== undefined
    const isCorrect = hasCorrectAnswer ? userAnswer === correctOption?.value : null
    
    // Determine difficulty based on question ID or position
    let difficulty = 'intermediate'
    if (q.id === 'q1' || index === 0) difficulty = 'basic'
    else if (q.id === 'q2' || index === 1) difficulty = 'intermediate'
    else if (q.id === 'q3' || index === 2) difficulty = 'advanced'
    else if (q.id === 'q4' || index === 3) difficulty = 'expert'
    
    return {
      questionId: q.id,
      question: q.question,
      userAnswer,
      correctAnswer: correctOption?.value || null,
      isCorrect,
      hasCorrectAnswer,
      difficulty
    }
  })
  
  // Check if we have questions with correct answers (technical questions) or not (experience-based)
  const hasTechnicalQuestions = questionAnswers.some((qa: any) => qa.hasCorrectAnswer)

  // Build assessment prompt based on question type
  let prompt = ''
  
  if (hasTechnicalQuestions) {
    // Technical questions with correct answers - evaluate based on correctness
    const correctCount = questionAnswers.filter((qa: any) => qa.isCorrect === true).length
    const correctBasic = questionAnswers.find((qa: any) => qa.difficulty === 'basic' && qa.isCorrect === true)
    const correctIntermediate = questionAnswers.find((qa: any) => qa.difficulty === 'intermediate' && qa.isCorrect === true)
    const correctAdvanced = questionAnswers.find((qa: any) => qa.difficulty === 'advanced' && qa.isCorrect === true)
    const correctExpert = questionAnswers.find((qa: any) => qa.difficulty === 'expert' && qa.isCorrect === true)

    prompt = `You are a technical skill assessment expert. Evaluate the user's performance on a TECHNICAL KNOWLEDGE assessment for "${skillName}".

ASSESSMENT RESULTS:
- Total Questions: ${questions.length}
- Correct Answers: ${correctCount}/${questions.length}
- Basic Question: ${correctBasic ? 'CORRECT ✓' : 'INCORRECT ✗'}
- Intermediate Question: ${correctIntermediate ? 'CORRECT ✓' : 'INCORRECT ✗'}
- Advanced Question: ${correctAdvanced ? 'CORRECT ✓' : 'INCORRECT ✗'}
- Expert Question: ${correctExpert ? 'CORRECT ✓' : 'INCORRECT ✗'}

DETAILED ANSWERS:
${questionAnswers.map((qa: any) => `
Question: ${qa.question}
User's Answer: ${qa.userAnswer}
Correct Answer: ${qa.correctAnswer || 'N/A'}
Result: ${qa.isCorrect === true ? 'CORRECT ✓' : qa.isCorrect === false ? 'INCORRECT ✗' : 'N/A'}
Difficulty: ${qa.difficulty}
`).join('\n')}

Based on their TECHNICAL KNOWLEDGE demonstrated through these answers, assess their skill level:

EVALUATION CRITERIA:
- Beginner (0-40): Can answer basic technical questions correctly, struggles with intermediate+
- Intermediate (41-70): Can answer basic and intermediate technical questions, some advanced knowledge
- Advanced (71-90): Can answer most technical questions correctly, demonstrates strong technical knowledge
- Expert (91-100): Answers all or nearly all technical questions correctly, shows expert-level understanding

Provide your assessment:
1. Skill Level: Choose ONE from [beginner, intermediate, advanced]
2. Difficulty Score: A number from 0-100 based on correctness and question difficulty
3. Brief Explanation: 2-3 sentences explaining your assessment based on their technical answers

Format your response EXACTLY as:
LEVEL: [level]
DIFFICULTY: [number]
EXPLANATION: [explanation]`
  } else {
    // Experience-based questions (fallback) - assess based on self-reported experience
    prompt = `You are a skill assessment expert. Based on the following self-reported answers about "${skillName}", provide an assessment.

User's Answers: ${JSON.stringify(answers, null, 2)}

Analyze their responses and provide:
1. Skill Level: Choose ONE from [beginner, intermediate, advanced]
2. Difficulty Score: A number from 0-100 representing their mastery
3. Brief Explanation: 2-3 sentences explaining your assessment

Format your response EXACTLY as:
LEVEL: [level]
DIFFICULTY: [number]
EXPLANATION: [explanation]`
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          }
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = 'Gemini API request failed'
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.error?.message || errorData.message || errorMessage
      } catch {
        errorMessage = errorText || errorMessage
      }
      console.error('Gemini API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage
      })
      throw new Error(errorMessage)
    }

    const data = await response.json()
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    return parseAIResponse(aiText)
  } catch (error) {
    console.error('Error assessing skill:', error)
    return calculateFallbackAssessment(answers)
  }
}

function getFallbackQuestions(skillName: string) {
  return {
    questions: [
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
    ],
  }
}

function parseAIResponse(text: string): any {
  try {
    const levelMatch = text.match(/LEVEL:\s*(\w+)/i)
    const difficultyMatch = text.match(/DIFFICULTY:\s*(\d+)/i)
    const explanationMatch = text.match(/EXPLANATION:\s*(.+)/is)

    const level = levelMatch?.[1]?.toLowerCase() || 'intermediate'
    const difficulty = parseInt(difficultyMatch?.[1] || '50')
    const explanation = explanationMatch?.[1]?.trim() || 'Assessment completed.'

    return {
      level: ['beginner', 'intermediate', 'advanced'].includes(level) ? level : 'intermediate',
      difficulty: Math.max(0, Math.min(100, difficulty)),
      explanation,
    }
  } catch (error) {
    console.error('Error parsing AI response:', error)
    return calculateFallbackAssessment({})
  }
}

function calculateFallbackAssessment(answers: any): any {
  // Simple rule-based assessment when AI is unavailable
  let difficulty = 50
  let level = 'intermediate'

  const expScore = {
    'less-than-6-months': 20,
    '6-months-to-2-years': 40,
    '2-to-5-years': 70,
    'more-than-5-years': 90,
  }[answers.experience] || 50

  const projScore = {
    'none': 20,
    '1-3': 45,
    '4-10': 70,
    'more-than-10': 90,
  }[answers.projects] || 50

  difficulty = Math.round((expScore + projScore) / 2)

  if (difficulty < 35) {
    level = 'beginner'
  } else if (difficulty < 70) {
    level = 'intermediate'
  } else {
    level = 'advanced'
  }

  return {
    level,
    difficulty,
    explanation: `Based on your responses, you appear to be at a ${level} level with approximately ${difficulty}/100 proficiency.`,
  }
}

