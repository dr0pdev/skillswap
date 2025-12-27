# 🚀 DEPLOY EDGE FUNCTION VIA SUPABASE DASHBOARD

## 📋 STEP-BY-STEP INSTRUCTIONS

### Step 1: Create New Function
1. In the Supabase dashboard, click **"Deploy a new function"** (green button)
2. Select **"Via Editor"** from the dropdown
3. Function name: `assess-skill` (must match exactly!)

### Step 2: Copy the Function Code
Copy the ENTIRE code from the file below and paste it into the editor:

---

## 📄 FUNCTION CODE TO COPY

```typescript
// Supabase Edge Function for AI Skill Assessment
// Uses Gemini API to generate dynamic questions and assess user skill level

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
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

    // Get Gemini API key from environment (support both uppercase and lowercase)
    // Supabase secrets are accessed via Deno.env.get()
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('gemini_api_key')
    
    // Debug logging (remove in production)
    console.log('API Key check:', {
      hasGEMINI_API_KEY: !!Deno.env.get('GEMINI_API_KEY'),
      hasgemini_api_key: !!Deno.env.get('gemini_api_key'),
      hasApiKey: !!geminiApiKey,
      action: action
    })
    
    if (!geminiApiKey) {
      console.log('⚠️ Gemini API key not found in environment variables, using fallback')
      console.log('Available env vars:', Object.keys(Deno.env.toObject()).filter(k => k.toLowerCase().includes('gemini')))
      
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
      const questions = await generateQuestionsWithGemini(skillName, geminiApiKey)
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
      const assessment = await assessSkillWithGemini(skillName, answers, geminiApiKey)
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

async function generateQuestionsWithGemini(skillName: string, apiKey: string) {
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 1500,
          }
        }),
      }
    )

    if (!response.ok) {
      throw new Error('Gemini API request failed')
    }

    const data = await response.json()
    const text = data.candidates[0]?.content?.parts[0]?.text || ''
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      // Ensure it has the questions property
      if (parsed.questions && Array.isArray(parsed.questions)) {
        console.log('✅ Successfully generated', parsed.questions.length, 'questions from Gemini')
        return parsed
      } else {
        console.warn('⚠️ Gemini response missing questions array, using fallback')
        return getFallbackQuestions(skillName)
      }
    }
    
    throw new Error('Could not parse questions from Gemini')
  } catch (error) {
    console.error('❌ Error generating questions:', error)
    return getFallbackQuestions(skillName)
  }
}

async function assessSkillWithGemini(skillName: string, answers: any, apiKey: string) {
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          }
        }),
      }
    )

    if (!response.ok) {
      throw new Error('Gemini API request failed')
    }

    const data = await response.json()
    const aiText = data.candidates[0]?.content?.parts[0]?.text || ''

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
```

---

### Step 3: Deploy the Function
1. Paste the code above into the editor
2. Click **"Deploy"** button (usually bottom right)
3. Wait for deployment to complete (should show "Deployed successfully")

### Step 4: Set the API Key Secret
1. In the left sidebar, click **"Secrets"** (under MANAGE)
2. Click **"Add new secret"** or **"New secret"**
3. Name: `gemini_api_key` (lowercase)
4. Value: Your actual Gemini API key
5. Click **"Save"**

### Step 5: Verify Deployment
1. Go back to **"Functions"** in the sidebar
2. You should now see `assess-skill` in the list
3. Click on it to see details and logs

### Step 6: Test
1. Go back to your app
2. Hard refresh: `Ctrl + Shift + R`
3. Try "Use AI to Assess My Skill Level"
4. Check console - should NOT see CORS errors anymore!

---

## ✅ QUICK CHECKLIST

- [ ] Function created: `assess-skill`
- [ ] Code pasted into editor
- [ ] Function deployed successfully
- [ ] Secret set: `gemini_api_key` = your API key
- [ ] Browser cache cleared
- [ ] Tested - no CORS errors

---

## 🐛 IF STILL NOT WORKING

1. **Check function logs**: Click on `assess-skill` → "Logs" tab
2. **Verify secret**: Go to "Secrets" → Should see `gemini_api_key`
3. **Check function URL**: Should be `https://hpoyfmtbdupvohpxkgko.supabase.co/functions/v1/assess-skill`
4. **Try redeploying**: Click "Redeploy" in the function page

