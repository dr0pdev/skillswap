# 🔧 FIX: 401 Unauthorized Error in Edge Function

## Problem
The Edge Function is returning `401 Unauthorized` even though:
- ✅ Function is deployed
- ✅ API key is set in Supabase secrets
- ✅ User is logged in

## Root Cause
The Edge Function's JWT verification is failing because:
1. The Authorization header might not be properly formatted
2. The session token might be expired or invalid
3. The function needs better error handling and debugging

## Solution

### Step 1: Update the Edge Function Code

The function code has been updated with:
- ✅ Better Authorization header handling
- ✅ Multiple authentication verification methods
- ✅ Enhanced debug logging
- ✅ Better error messages

### Step 2: Redeploy the Function

**Option A: Via Supabase Dashboard**
1. Go to **Edge Functions** → **assess-skill**
2. Click **Edit** (or **Deploy a new function** if it doesn't exist)
3. Copy the **ENTIRE** code from `supabase/functions/assess-skill/index.ts`
4. Paste into the editor
5. Click **Deploy**

**Option B: Via CLI**
```bash
supabase functions deploy assess-skill
```

### Step 3: Verify Secrets Are Set

1. Go to **Project Settings** → **Edge Functions** → **Secrets**
2. Verify `gemini_api_key` is set (value: your Gemini API key)
3. If missing, add it:
   - Name: `gemini_api_key`
   - Value: `AIzaSyDnMrVFdFTz7dsTlUMbrn-CnQ7xruvNBX8` (your actual key)

### Step 4: Check Function Logs

1. Go to **Edge Functions** → **assess-skill** → **Logs**
2. Look for:
   - `Request headers:` - Should show `hasAuth: true`
   - `Auth check:` - Should show `hasUser: true` and user email
   - Any error messages

### Step 5: Test the Function

1. Open your app in the browser
2. Open **Developer Console** (F12)
3. Go to **Skills** page
4. Try to add a skill and use AI Assessment
5. Check console for errors
6. Check Edge Function logs in Supabase dashboard

## Debugging Steps

### If Still Getting 401:

1. **Check Browser Console:**
   - Look for the exact error message
   - Check if session is valid: `await supabase.auth.getSession()`

2. **Check Edge Function Logs:**
   - Go to Supabase Dashboard → Edge Functions → assess-skill → Logs
   - Look for:
     - `Request headers:` - Does it show `hasAuth: true`?
     - `Auth check:` - What does it show?
     - Any error messages

3. **Verify Session:**
   - In browser console, run:
     ```javascript
     const { data: { session } } = await supabase.auth.getSession()
     console.log('Session:', session)
     ```
   - If `session` is `null`, you need to log in again

4. **Check Function URL:**
   - Make sure the function URL matches your project
   - Should be: `https://[your-project-ref].supabase.co/functions/v1/assess-skill`

## Updated Code Changes

### Client-Side (`AIAssessment.jsx`)
- ✅ Added session validation before calling the function
- ✅ Better error handling

### Edge Function (`assess-skill/index.ts`)
- ✅ Enhanced Authorization header handling
- ✅ Multiple authentication verification methods
- ✅ Better debug logging
- ✅ Improved error messages

## Expected Behavior After Fix

1. ✅ Function receives Authorization header
2. ✅ JWT is verified successfully
3. ✅ User is authenticated
4. ✅ Function processes the request
5. ✅ Returns questions or assessment

## Still Having Issues?

If you're still getting 401 errors:

1. **Clear browser cache and localStorage:**
   ```javascript
   localStorage.clear()
   sessionStorage.clear()
   ```

2. **Log out and log back in**

3. **Check Supabase Dashboard:**
   - Edge Functions → assess-skill → Logs
   - Look for specific error messages

4. **Verify Environment Variables:**
   - In Edge Function logs, check if `SUPABASE_URL` and `SUPABASE_ANON_KEY` are available
   - These should be automatically set by Supabase

5. **Try calling the function directly:**
   ```javascript
   const { data: { session } } = await supabase.auth.getSession()
   const response = await fetch('https://[your-project].supabase.co/functions/v1/assess-skill', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${session.access_token}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       skillName: 'JavaScript',
       action: 'generate-questions'
     })
   })
   console.log('Response:', await response.json())
   ```

## Next Steps

1. ✅ Deploy the updated function code
2. ✅ Verify secrets are set
3. ✅ Test the function
4. ✅ Check logs if issues persist
5. ✅ Report any remaining errors with logs

