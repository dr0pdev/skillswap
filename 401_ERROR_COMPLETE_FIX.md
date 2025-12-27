# 🔧 COMPLETE FIX: 401 Unauthorized Error

## ✅ Changes Made

### 1. Edge Function (`supabase/functions/assess-skill/index.ts`)
- ✅ Enhanced Authorization header handling
- ✅ Better debug logging to track auth flow
- ✅ Improved error messages
- ✅ Proper Supabase client initialization

### 2. Client Code (`src/components/skills/AIAssessment.jsx`)
- ✅ Added session validation before function calls
- ✅ Added session refresh logic if session is expired
- ✅ Enhanced logging to track session state
- ✅ Better error handling

## 🚀 DEPLOYMENT STEPS

### Step 1: Redeploy the Edge Function

**Via Supabase Dashboard:**
1. Go to **Edge Functions** → **assess-skill**
2. Click **Edit** (or open the function)
3. **Delete ALL existing code**
4. Copy **ENTIRE** code from `supabase/functions/assess-skill/index.ts`
5. Paste into editor
6. Click **Deploy** (or **Save** then **Deploy**)

**Via CLI:**
```bash
supabase functions deploy assess-skill
```

### Step 2: Verify Secrets

1. Go to **Project Settings** → **Edge Functions** → **Secrets**
2. Verify `gemini_api_key` exists
3. If missing, add it:
   - Name: `gemini_api_key`
   - Value: Your Gemini API key

### Step 3: Test the Function

1. **Hard refresh browser**: `Ctrl + Shift + R`
2. **Open Developer Console** (F12)
3. **Log in** to your app
4. **Go to Skills page**
5. **Try AI Assessment**
6. **Check console logs** - Should see:
   - `✅ Session found, calling function:`
   - No 401 errors

### Step 4: Check Edge Function Logs

1. Go to **Edge Functions** → **assess-skill** → **Logs**
2. Look for:
   - `🔍 Request received:` - Should show `hasAuthHeader: true`
   - `👤 Auth verification:` - Should show `hasUser: true` and user email
   - Any error messages

## 🐛 TROUBLESHOOTING

### If Still Getting 401:

#### 1. Check Browser Console
Look for these logs:
- `✅ Session found, calling function:` - Should show session details
- `❌ No valid session found:` - Means you need to log in again

#### 2. Check Edge Function Logs
In Supabase Dashboard → Edge Functions → assess-skill → Logs:
- `🔍 Request received:` - Check `hasAuthHeader`
- `👤 Auth verification:` - Check `hasUser` and `error`

#### 3. Verify Session is Valid
In browser console, run:
```javascript
const { data: { session }, error } = await supabase.auth.getSession()
console.log('Session:', session)
console.log('Error:', error)
```

If `session` is `null`, you need to:
- Log out and log back in
- Clear localStorage: `localStorage.clear()`

#### 4. Check Token Expiration
```javascript
const { data: { session } } = await supabase.auth.getSession()
if (session) {
  const expiresAt = new Date(session.expires_at * 1000)
  console.log('Token expires at:', expiresAt)
  console.log('Is expired?', expiresAt < new Date())
}
```

#### 5. Try Manual Function Call
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
    skillName: 'JavaScript',
    action: 'generate-questions'
  })
})
console.log('Status:', response.status)
console.log('Response:', await response.json())
```

## 📋 EXPECTED BEHAVIOR

### Success Flow:
1. ✅ User is logged in
2. ✅ Session is valid
3. ✅ Client calls `functions.invoke()`
4. ✅ Supabase automatically adds `Authorization: Bearer <token>` header
5. ✅ Edge Function receives header
6. ✅ Function verifies JWT
7. ✅ Function processes request
8. ✅ Returns questions/assessment

### Error Flow:
1. ❌ No session → Client shows fallback questions
2. ❌ Expired token → Client refreshes session
3. ❌ Invalid token → Function returns 401, client shows fallback
4. ❌ Missing header → Function returns 401, client shows fallback

## 🔍 DEBUG CHECKLIST

- [ ] Function is deployed (check Supabase dashboard)
- [ ] `gemini_api_key` secret is set
- [ ] User is logged in
- [ ] Session is valid (check browser console)
- [ ] Authorization header is sent (check Edge Function logs)
- [ ] JWT verification succeeds (check Edge Function logs)
- [ ] No CORS errors in browser console
- [ ] Function logs show successful request processing

## 📞 NEXT STEPS IF STILL FAILING

1. **Share Edge Function Logs:**
   - Go to Edge Functions → assess-skill → Logs
   - Copy the logs from the failed request
   - Share with me

2. **Share Browser Console:**
   - Open Developer Console
   - Try AI Assessment
   - Copy all logs/errors
   - Share with me

3. **Check Function URL:**
   - Make sure it matches: `https://hpoyfmtbdupvohpxkgko.supabase.co/functions/v1/assess-skill`
   - Check if function is actually deployed

4. **Verify Project Settings:**
   - Check if JWT verification is enabled for the function
   - Check if there are any project-level auth restrictions

## 🎯 QUICK TEST

Run this in browser console after logging in:
```javascript
// Test 1: Check session
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session ? '✅ Valid' : '❌ Invalid')

// Test 2: Call function directly
const { data, error } = await supabase.functions.invoke('assess-skill', {
  body: { skillName: 'Test', action: 'generate-questions' }
})
console.log('Function result:', { data, error })
```

If Test 1 fails → Log in again
If Test 2 fails → Check Edge Function logs

