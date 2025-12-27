// Supabase Edge Function for AI Skill Assessment
// Uses OpenRouter API to generate dynamic questions and assess user skill level

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
    // Get Authorization header - Supabase sends it automatically via functions.invoke()
    const authHeader = req.headers.get('Authorization')
    
    // Debug logging
    console.log('🔍 Request received:', {
      method: req.method,
      url: req.url,
      hasAuthHeader: !!authHeader,
      authHeaderPrefix: authHeader?.substring(0, 20) || 'none'
    })

    // Initialize Supabase client FIRST (before auth check)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    
    console.log('🔧 Supabase config:', {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      urlLength: supabaseUrl.length
    })

    // Create client with auth header if available
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      authHeader ? {
        global: {
          headers: { Authorization: authHeader },
        },
      } : {}
    )

    // Verify authentication
    let user = null
    let authError = null

    if (authHeader) {
      // Try to get user with the auth header
      try {
        const userResponse = await supabaseClient.auth.getUser()
        user = userResponse.data?.user
        authError = userResponse.error
        
        console.log('👤 Auth verification:', {
          hasUser: !!user,
          userId: user?.id,
          email: user?.email,
          error: authError?.message || null
        })
      } catch (err) {
        console.error('❌ Auth verification error:', err)
        authError = err
      }
    } else {
      console.warn('⚠️ No Authorization header - checking if auth is required')
      // For now, we require auth - but you could make it optional
      authError = new Error('Missing Authorization header')
    }

    if (authError || !user) {
      console.error('❌ Authentication failed:', {
        error: authError?.message || 'No user found',
        hasAuthHeader: !!authHeader
      })
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        details: authError?.message || 'Authentication failed. Please log in again.'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse request body
    const { skillName, answers, action } = await req.json()

    if (!skillName) {
      return new Response(
        JSON.stringify({ error: 'skillName is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get OpenRouter API key from environment (support both uppercase and lowercase)
    // Supabase secrets are accessed via Deno.env.get()
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY') || Deno.env.get('openrouter_api_key')
    // Optional: specify model (defaults to gpt-3.5-turbo)
    const openRouterModel = Deno.env.get('OPENROUTER_MODEL') || 'openai/gpt-3.5-turbo'
    
    // Debug logging (remove in production)
    console.log('API Key check:', {
      hasOPENROUTER_API_KEY: !!Deno.env.get('OPENROUTER_API_KEY'),
      hasopenrouter_api_key: !!Deno.env.get('openrouter_api_key'),
      hasApiKey: !!openRouterApiKey,
      model: openRouterModel,
      action: action
    })
    
    if (!openRouterApiKey) {
      console.log('⚠️ OpenRouter API key not found in environment variables, using fallback')
      console.log('Available env vars:', Object.keys(Deno.env.toObject()).filter(k => k.toLowerCase().includes('openrouter')))
      
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
      // Generate skill-specific questions
      console.log('Generating questions for:', skillName)
      const questions = await generateQuestionsWithOpenRouter(skillName, openRouterApiKey, openRouterModel)
      return new Response(JSON.stringify(questions), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else {
      // Assess skill level based on answers
      if (!answers) {
        return new Response(
          JSON.stringify({ error: 'answers are required for assessment' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      console.log('Assessing skill:', skillName, 'with', Object.keys(answers).length, 'answers')
      const assessment = await assessSkillWithOpenRouter(skillName, answers, openRouterApiKey, openRouterModel)
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

async function generateQuestionsWithOpenRouter(skillName: string, apiKey: string, model: string) {
  const prompt = `You are a skill assessment expert. Generate 4 specific, practical questions to assess someone's proficiency in "${skillName}".

Each question should:
- Be specific to ${skillName}
- Have 4 multiple-choice options
- Progress from basic to advanced understanding
- Help determine if they are beginner, intermediate, or advanced

Format your response EXACTLY as JSON:
{
  "questions": [
    {
      "id": "q1",
      "question": "Question text here?",
      "options": [
        {"value": "opt1", "label": "Option 1 text"},
        {"value": "opt2", "label": "Option 2 text"},
        {"value": "opt3", "label": "Option 3 text"},
        {"value": "opt4", "label": "Option 4 text"}
      ]
    }
  ]
}`

  try {
    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://skillswap.app', // Optional: for OpenRouter analytics
          'X-Title': 'SkillSwap', // Optional: for OpenRouter analytics
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8,
          max_tokens: 1500,
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouter API error:', errorText)
      throw new Error('OpenRouter API request failed')
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ''
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return parsed
    }
    
    throw new Error('Could not parse questions from OpenRouter response')
  } catch (error) {
    console.error('Error generating questions:', error)
    return getFallbackQuestions(skillName)
  }
}

async function assessSkillWithOpenRouter(skillName: string, answers: any, apiKey: string, model: string) {
  const prompt = `You are a skill assessment expert. Based on the following answers about "${skillName}", provide an assessment.

User's Answers: ${JSON.stringify(answers, null, 2)}

Analyze their responses and provide:
1. Skill Level: Choose ONE from [beginner, intermediate, advanced]
2. Difficulty Score: A number from 0-100 representing their mastery
3. Brief Explanation: 2-3 sentences explaining your assessment

Format your response EXACTLY as:
LEVEL: [level]
DIFFICULTY: [number]
EXPLANATION: [explanation]`

  try {
    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://skillswap.app', // Optional: for OpenRouter analytics
          'X-Title': 'SkillSwap', // Optional: for OpenRouter analytics
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouter API error:', errorText)
      throw new Error('OpenRouter API request failed')
    }

    const data = await response.json()
    const aiText = data.choices?.[0]?.message?.content || ''

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

