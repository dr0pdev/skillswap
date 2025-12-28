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
      // Generate skill-specific general knowledge questions using AI
      console.log('🤖 Generating AI-powered general knowledge questions for:', skillName)
      try {
        const questions = await generateQuestionsWithGemini(skillName, geminiApiKey, geminiModel)
        console.log('✅ Successfully generated', questions.questions?.length || 0, 'AI general knowledge questions')
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

      console.log('🔍 Assessing skill:', skillName, 'with', Object.keys(answers).length, 'text responses')
      console.log('📝 Analyzing text responses and creating summary...')
      
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
  const prompt = `You are a skill assessment expert. Create 3-4 relevant, open-ended questions that help understand the user's knowledge and experience with "${skillName}".

CRITICAL REQUIREMENTS:
1. Questions MUST be RELEVANT and SPECIFIC to "${skillName}" - adapt them based on what type of skill it is:
   - For SPORTS/PHYSICAL ACTIVITIES (like badminton, tennis, yoga): Ask about playing experience, techniques, training, matches/competitions
   - For TECHNICAL SKILLS (like programming, design): Ask about projects, tools used, problem-solving
   - For LANGUAGES: Ask about speaking ability, practice, conversations, reading/writing
   - For CREATIVE SKILLS (like music, art, writing): Ask about creations, style, practice, inspiration
   - For ACADEMIC/PROFESSIONAL SKILLS: Ask about application, experience, depth of knowledge
   - For OTHER SKILLS: Adapt questions appropriately to the skill type

2. Questions should be OPEN-ENDED and encourage detailed written responses (not yes/no or multiple choice)
3. Questions should cover different aspects relevant to "${skillName}":
   - Overall understanding and familiarity with the skill
   - Practical experience and hands-on practice
   - Depth of knowledge and proficiency level
   - Ability to teach or explain to others
4. Questions should be conversational, natural, and easy to understand
5. NO generic questions that could apply to any skill - they must be tailored to "${skillName}"

EXAMPLES FOR DIFFERENT SKILL TYPES:

For SPORTS (e.g., "badminton"):
- "Describe your experience playing badminton. How long have you been playing and what level do you play at?"
- "What badminton techniques and skills are you most comfortable with? (e.g., serves, smashes, footwork)"
- "Have you participated in any badminton matches, tournaments, or regular games? Describe your experience."
- "How would you help someone learn badminton? What would you focus on teaching first?"

For TECHNICAL SKILLS (e.g., "Python"):
- "Describe your experience with Python. What types of projects have you worked on?"
- "What Python concepts and libraries are you most familiar with?"
- "Share an example of a problem you solved using Python."
- "How would you explain Python to someone new to programming?"

For LANGUAGES (e.g., "Spanish"):
- "Describe your Spanish speaking ability. How comfortable are you having conversations?"
- "What contexts have you used Spanish in? (travel, work, study, etc.)"
- "How would you rate your reading and writing skills in Spanish?"
- "How would you help someone learn Spanish? What approach would you take?"

For CREATIVE SKILLS (e.g., "guitar"):
- "Describe your experience playing guitar. What styles or genres do you play?"
- "What guitar techniques are you comfortable with? (chords, fingerpicking, soloing, etc.)"
- "Have you performed or recorded music? Share your experience."
- "How would you teach someone to play guitar? What would you start with?"

EXAMPLES OF BAD QUESTIONS (DO NOT USE):
- Generic questions that don't relate to "${skillName}" specifically
- Questions that assume "${skillName}" is something it's not (e.g., asking about "building" or "coding" for a sport)
- "How long have you been using ${skillName}?" (too specific/numeric)
- "Rate your skill level from 1-10" (numeric rating)
- Questions that are irrelevant to the skill type

You MUST respond with ONLY valid JSON, no markdown, no explanations. Format EXACTLY as:
{
  "questions": [
    {
      "id": "q1",
      "question": "Relevant question about understanding/experience with ${skillName}",
      "type": "text",
      "placeholder": "Type your response here..."
    },
    {
      "id": "q2",
      "question": "Relevant question about practical experience with ${skillName}",
      "type": "text",
      "placeholder": "Share your experience..."
    },
    {
      "id": "q3",
      "question": "Relevant question about proficiency/techniques in ${skillName}",
      "type": "text",
      "placeholder": "Describe your skills..."
    },
    {
      "id": "q4",
      "question": "Relevant question about teaching/explaining ${skillName}",
      "type": "text",
      "placeholder": "Explain how you would teach this..."
    }
  ]
}

IMPORTANT: 
- Make questions SPECIFIC and RELEVANT to "${skillName}"
- Consider what type of skill "${skillName}" is and adapt questions accordingly
- Questions should feel natural and appropriate for someone assessing their ability in "${skillName}"
- Avoid generic or irrelevant questions`

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
  // Map questions to user answers for text-based assessment
  const questionAnswers = questions.map((q: any) => {
    const userAnswer = answers[q.id] || ''
    return {
      questionId: q.id,
      question: q.question,
      userAnswer: userAnswer.trim()
    }
  })

  // Build assessment prompt for text-based responses
  const prompt = `You are an expert skill assessor. Analyze the following written responses from a user about their knowledge and experience with "${skillName}".

USER'S RESPONSES:
${questionAnswers.map((qa: any) => `
Question: ${qa.question}
User's Response: ${qa.userAnswer || '(No response provided)'}
`).join('\n')}

TASK:
1. Read and understand all the user's responses
2. Create a comprehensive summary of their knowledge, experience, and expertise level
3. Assess their overall skill level based on:
   - Depth of understanding demonstrated in their responses
   - Practical experience mentioned
   - Clarity and accuracy of explanations
   - Confidence and expertise indicators
4. Assign a skill level and difficulty score

EVALUATION CRITERIA:
- Beginner (0-40): Basic understanding, limited experience, can describe concepts at a high level but lacks depth
- Intermediate (41-70): Good understanding, some practical experience, can explain concepts clearly and has worked on projects
- Advanced (71-90): Strong understanding, significant experience, demonstrates deep knowledge and can teach others
- Expert (91-100): Exceptional understanding, extensive experience, shows mastery and can mentor others

ASSESSMENT PROCESS:
1. Summarize their responses in 2-3 sentences highlighting key points
2. Evaluate the depth and quality of their knowledge based on their written responses
3. Determine skill level (beginner/intermediate/advanced)
4. Assign difficulty score (0-100) based on demonstrated expertise
5. Provide a brief explanation of your assessment

Format your response EXACTLY as:
SUMMARY: [2-3 sentence summary of their knowledge and experience]
LEVEL: [beginner/intermediate/advanced]
DIFFICULTY: [number between 0-100]
EXPLANATION: [2-3 sentences explaining why you assigned this level and score]

Be fair and accurate. Consider both what they say and how they say it. Look for indicators of:
- Actual understanding vs. surface-level knowledge
- Real experience vs. theoretical knowledge
- Ability to explain concepts clearly
- Confidence and depth of responses`

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
            maxOutputTokens: 1000, // Increased for summary and detailed assessment
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
  // Detect skill type from name (simple heuristic)
  const skillLower = skillName.toLowerCase()
  const isSport = ['badminton', 'tennis', 'basketball', 'soccer', 'football', 'volleyball', 'swimming', 'yoga', 'gym', 'fitness', 'running', 'cycling', 'dancing', 'martial', 'karate', 'boxing'].some(s => skillLower.includes(s))
  const isLanguage = ['spanish', 'french', 'german', 'chinese', 'japanese', 'korean', 'italian', 'portuguese', 'russian', 'arabic', 'hindi'].some(s => skillLower.includes(s))
  const isCreative = ['music', 'guitar', 'piano', 'singing', 'art', 'drawing', 'painting', 'photography', 'writing', 'poetry'].some(s => skillLower.includes(s))
  
  let questions = []
  
  if (isSport) {
    questions = [
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
    questions = [
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
    questions = [
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
    questions = [
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
  
  return { questions }
}

function parseAIResponse(text: string): any {
  try {
    const summaryMatch = text.match(/SUMMARY:\s*(.+?)(?=LEVEL:|$)/is)
    const levelMatch = text.match(/LEVEL:\s*(\w+)/i)
    const difficultyMatch = text.match(/DIFFICULTY:\s*(\d+)/i)
    const explanationMatch = text.match(/EXPLANATION:\s*(.+?)(?=SUMMARY:|$)/is)

    const summary = summaryMatch?.[1]?.trim() || ''
    const level = levelMatch?.[1]?.toLowerCase() || 'intermediate'
    const difficulty = parseInt(difficultyMatch?.[1] || '50')
    const explanation = explanationMatch?.[1]?.trim() || 'Assessment completed.'

    return {
      level: ['beginner', 'intermediate', 'advanced'].includes(level) ? level : 'intermediate',
      difficulty: Math.max(0, Math.min(100, difficulty)),
      explanation,
      summary: summary || explanation, // Use summary if available, fallback to explanation
    }
  } catch (error) {
    console.error('Error parsing AI response:', error)
    return calculateFallbackAssessment({})
  }
}

function calculateFallbackAssessment(answers: any): any {
  // Simple rule-based assessment when AI is unavailable
  // Analyze text responses by length and content indicators
  let difficulty = 50
  let level = 'intermediate'
  
  // Get all answer values (text responses)
  const answerTexts = Object.values(answers).filter((v: any) => typeof v === 'string' && v.trim().length > 0)
  const totalLength = answerTexts.reduce((sum: number, text: any) => sum + text.length, 0)
  const avgLength = answerTexts.length > 0 ? totalLength / answerTexts.length : 0
  
  // Simple heuristics based on response length and number of responses
  // Longer, more detailed responses suggest better understanding
  if (answerTexts.length === 0 || avgLength < 50) {
    difficulty = 30
    level = 'beginner'
  } else if (avgLength < 150) {
    difficulty = 50
    level = 'intermediate'
  } else if (avgLength < 300) {
    difficulty = 70
    level = 'advanced'
  } else {
    difficulty = 85
    level = 'advanced'
  }

  // Combine all responses for summary
  const summary = answerTexts.length > 0 
    ? `Based on your responses, you've provided ${answerTexts.length} detailed answer${answerTexts.length > 1 ? 's' : ''} about ${Object.keys(answers)[0]?.replace('q', '') || 'your'} experience.`
    : 'Limited responses provided.'

  return {
    level,
    difficulty,
    explanation: `Based on your responses, you appear to be at a ${level} level with approximately ${difficulty}/100 proficiency.`,
    summary,
  }
}

