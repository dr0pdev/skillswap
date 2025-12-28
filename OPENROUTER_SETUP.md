# 🔧 OpenRouter Integration Setup Guide

## ✅ What Was Changed

The Edge Function (`supabase/functions/assess-skill/index.ts`) has been updated to support **both OpenRouter and Gemini API**:

1. **Dual Provider Support**: Checks for OpenRouter key first, then falls back to Gemini
2. **New Functions Added**:
   - `generateQuestionsWithOpenRouter()` - Generates questions via OpenRouter
   - `assessSkillWithOpenRouter()` - Assesses skills via OpenRouter
3. **Automatic Detection**: Uses OpenRouter if `OPENROUTER_API_KEY` is set, otherwise uses Gemini

## 🚀 Setup Instructions

### Step 1: Get Your OpenRouter API Key

1. Go to: https://openrouter.ai/
2. Sign up or log in
3. Go to **Keys** section
4. Click **Create Key**
5. Copy your API key (starts with `sk-or-...`)

### Step 2: Set Secret in Supabase

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to **Supabase Dashboard** → Your Project
2. Navigate to **Edge Functions** → **Secrets**
3. Click **Add Secret** or **Manage Secrets**
4. Add:
   - **Name**: `OPENROUTER_API_KEY`, `openrouter_api_key`, or `open_router_key` (any of these work)
   - **Value**: Your OpenRouter API key
5. Click **Save**

**Option B: Via CLI**

```bash
supabase secrets set open_router_key=your_openrouter_key_here
# OR
supabase secrets set OPENROUTER_API_KEY=your_openrouter_key_here
# OR
supabase secrets set openrouter_api_key=your_openrouter_key_here
```

### Step 3: Redeploy the Edge Function

**Via Dashboard:**
1. Go to **Edge Functions** → **assess-skill**
2. Click **Edit**
3. Copy the updated code from `supabase/functions/assess-skill/index.ts`
4. Paste and **Deploy**

**Via CLI:**
```bash
supabase functions deploy assess-skill
```

### Step 4: Verify It's Working

1. **Check Function Logs**:
   - Go to **Edge Functions** → **assess-skill** → **Logs**
   - Look for: `useOpenRouter: true` in the logs

2. **Test in App**:
   - Add a skill → Click "Use AI to Assess My Skill Level"
   - You should see dynamic questions (not fallback)
   - Check browser console for logs

## 🔍 How It Works

### Detection Logic

```typescript
// Checks in this order:
1. OPENROUTER_API_KEY or openrouter_api_key or open_router_key → Use OpenRouter
2. GEMINI_API_KEY or gemini_api_key → Use Gemini
3. Neither → Use fallback (hardcoded questions)
```

### OpenRouter API Format

**Endpoint**: `https://openrouter.ai/api/v1/chat/completions`

**Request Format**:
```json
{
  "model": "google/gemini-pro",
  "messages": [
    {
      "role": "user",
      "content": "Your prompt here"
    }
  ],
  "temperature": 0.8,
  "max_tokens": 1500
}
```

**Response Format**:
```json
{
  "choices": [
    {
      "message": {
        "content": "AI response text"
      }
    }
  ]
}
```

## 🎯 Models Available via OpenRouter

You can change the model in the code if needed:

- `google/gemini-pro` (current)
- `google/gemini-pro-vision`
- `anthropic/claude-3-opus`
- `openai/gpt-4`
- `meta-llama/llama-3-70b-instruct`
- And many more...

To change model, edit these lines in `index.ts`:
```typescript
model: 'google/gemini-pro', // Change this
```

## 🐛 Troubleshooting

### Still Using Fallback?

1. **Check Secret Name**:
   - Must be one of: `OPENROUTER_API_KEY`, `openrouter_api_key`, or `open_router_key`
   - The code checks for all three variations

2. **Check Function Logs**:
   - Look for: `hasOpenRouterKey: true`
   - If `false`, secret not set correctly

3. **Redeploy Function**:
   - Secrets are loaded when function deploys
   - Must redeploy after setting secret

4. **Check API Key**:
   - OpenRouter key starts with `sk-or-`
   - Make sure it's valid and has credits

### API Errors?

1. **Check OpenRouter Dashboard**:
   - Verify API key is active
   - Check usage/credits
   - Review error logs

2. **Check Function Logs**:
   - Look for error messages
   - Check response status codes

3. **Test API Key**:
   ```bash
   curl https://openrouter.ai/api/v1/models \
     -H "Authorization: Bearer YOUR_KEY"
   ```

## 📊 Benefits of OpenRouter

1. **Multiple Models**: Access to many AI models
2. **Unified API**: Same format for all models
3. **Better Pricing**: Often cheaper than direct APIs
4. **Reliability**: Good uptime and support
5. **Analytics**: Built-in usage tracking

## 🔄 Fallback Behavior

If OpenRouter fails:
1. Tries to parse response
2. Falls back to hardcoded questions
3. User experience remains smooth
4. No errors shown to user

## ✅ Verification Checklist

- [ ] OpenRouter API key obtained
- [ ] Secret set in Supabase (`OPENROUTER_API_KEY`)
- [ ] Edge Function redeployed
- [ ] Function logs show `useOpenRouter: true`
- [ ] Dynamic questions appear (not fallback)
- [ ] Assessment works correctly

## 🎉 Success Indicators

When working correctly, you'll see:
- ✅ Dynamic, skill-specific questions
- ✅ Logs showing `useOpenRouter: true`
- ✅ No fallback messages in console
- ✅ AI-generated explanations

---

**Need Help?** Check the Edge Function logs in Supabase Dashboard for detailed error messages.

