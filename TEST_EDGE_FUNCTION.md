# 🧪 Testing Edge Function - 401 Error Fix

## Current Issue
Getting 401 Unauthorized error when calling the Edge Function, even though user is logged in.

## Changes Made

### 1. Enhanced Edge Function Debugging
- Added detailed logging for auth header detection
- Added alternative auth method (getSession) as fallback
- Better error messages with debug info

### 2. Client-Side Improvements
- Explicitly passing Authorization header in function calls
- Token expiration check and refresh
- Better error logging

## Steps to Fix

### Step 1: Redeploy Edge Function

**CRITICAL**: The function MUST be redeployed for changes to take effect!

**Via Dashboard:**
1. Go to **Supabase Dashboard** → **Edge Functions** → **assess-skill**
2. Click **Edit**
3. **Delete ALL existing code**
4. Copy **ENTIRE** code from `supabase/functions/assess-skill/index.ts`
5. Paste into editor
6. Click **Deploy**

**Via CLI:**
```bash
supabase functions deploy assess-skill
```

### Step 2: Verify Secret is Set

1. Go to **Edge Functions** → **Secrets**
2. Verify `open_router_key` exists (or `OPENROUTER_API_KEY` or `openrouter_api_key`)
3. If missing, add it with your OpenRouter API key

### Step 3: Test the Function

1. **Hard refresh browser**: `Ctrl + Shift + R`
2. **Open Developer Console** (F12)
3. **Log in** to your app
4. **Go to Skills page**
5. **Add a skill** → Click "Use AI to Assess My Skill Level"
6. **Check console logs** - Should see:
   - `✅ Session found, calling function:`
   - `📞 Calling Edge Function: assess-skill`
   - `📥 Function response:`

### Step 4: Check Edge Function Logs

1. Go to **Supabase Dashboard** → **Edge Functions** → **assess-skill** → **Logs**
2. Look for:
   - `🔍 Request received:` - Should show `hasAuthHeader: true`
   - `🔐 Attempting to verify JWT token...`
   - `👤 Auth verification result:` - Should show `hasUser: true`
   - `✅ Authentication successful for user:`

## Debugging Steps

### If Still Getting 401:

#### 1. Check Browser Console
Look for these logs:
- `✅ Session found` - Should show session details
- `📞 Calling Edge Function` - Should appear before the call
- `📥 Function response` - Shows what was returned

#### 2. Check Edge Function Logs
In Supabase Dashboard → Edge Functions → assess-skill → Logs:
- `🔍 Request received:` - Check `hasAuthHeader`
- `🔐 Attempting to verify JWT token...` - Should appear
- `👤 Auth verification result:` - Check `hasUser` and `error`

#### 3. Verify Session is Valid
In browser console, run:
```javascript
const { data: { session }, error } = await supabase.auth.getSession()
console.log('Session:', session)
console.log('Error:', error)
console.log('Token:', session?.access_token?.substring(0, 20) + '...')
```

#### 4. Test Function Directly
In browser console, run:
```javascript
const { data: { session } } = await supabase.auth.getSession()
const response = await fetch('https://hpoyfmtbdupvohpxkgko.supabase.co/functions/v1/assess-skill', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
    'apikey': 'YOUR_ANON_KEY' // Get from .env
  },
  body: JSON.stringify({
    skillName: 'Test',
    action: 'generate-questions'
  })
})
console.log('Status:', response.status)
console.log('Response:', await response.json())
```

## Expected Logs

### Browser Console (Success):
```
✅ Session found, calling function: { userId: '...', email: '...', hasAccessToken: true }
📞 Calling Edge Function: assess-skill
📥 Function response: { hasData: true, hasError: false }
```

### Edge Function Logs (Success):
```
🔍 Request received: { hasAuthHeader: true, ... }
🔐 Attempting to verify JWT token...
👤 Auth verification result: { hasUser: true, userId: '...', email: '...' }
✅ Authentication successful for user: user@example.com
API Key check: { hasOpenRouterKey: true, useOpenRouter: true, ... }
Generating questions for: [skillName]
```

## Common Issues

### Issue 1: Function Not Redeployed
**Symptom**: Still getting 401, logs don't show new debug messages
**Fix**: Redeploy the function (see Step 1)

### Issue 2: Secret Not Set
**Symptom**: Function works but uses fallback questions
**Fix**: Set `open_router_key` secret in Supabase

### Issue 3: Expired Token
**Symptom**: 401 error, token expired
**Fix**: Code now auto-refreshes tokens, but you may need to log out/in

### Issue 4: Wrong Secret Name
**Symptom**: `hasOpenRouterKey: false` in logs
**Fix**: Ensure secret is named `open_router_key`, `OPENROUTER_API_KEY`, or `openrouter_api_key`

## Next Steps

1. ✅ Redeploy Edge Function
2. ✅ Verify secret is set
3. ✅ Test in browser
4. ✅ Check logs
5. ✅ Report any remaining errors with log snippets


