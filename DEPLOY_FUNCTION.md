# 🚀 QUICK DEPLOYMENT GUIDE - Fix CORS Error

## ⚠️ THE PROBLEM

You're still getting CORS errors because **the fixed Edge Function hasn't been deployed yet**. The code is fixed locally, but Supabase is still running the old version.

## ✅ SOLUTION: Deploy the Function

### Option 1: Using Supabase CLI (Recommended)

**Step 1: Install Supabase CLI** (if not installed)
```bash
npm install -g supabase
```

**Step 2: Login to Supabase**
```bash
supabase login
```

**Step 3: Link your project** (if not already linked)
```bash
supabase link --project-ref hpoyfmtbdupvohpxkgko
```

**Step 4: Deploy the function**
```bash
supabase functions deploy assess-skill
```

**Step 5: Set the API key secret** (if not already set)
```bash
supabase secrets set gemini_api_key=your_actual_gemini_api_key_here
```

**Step 6: Verify deployment**
```bash
supabase functions list
```

### Option 2: Using Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/hpoyfmtbdupvohpxkgko
2. Navigate to: **Edge Functions** → **assess-skill**
3. Click **Deploy** or **Redeploy**
4. Upload/update the function code from `supabase/functions/assess-skill/index.ts`

### Option 3: Quick Test - Use Local Supabase

If you want to test locally first:

```bash
# Start local Supabase
supabase start

# Deploy function locally
supabase functions deploy assess-skill --no-verify-jwt

# Set secret locally
supabase secrets set gemini_api_key=your_key --env-file .env.local
```

## 🔍 VERIFY IT'S WORKING

After deployment:

1. **Hard refresh browser**: `Ctrl + Shift + R`
2. **Try AI assessment again**
3. **Check console** - Should NOT see CORS errors
4. **Check Supabase logs**:
   ```bash
   supabase functions logs assess-skill --follow
   ```

## 🐛 IF STILL GETTING CORS ERRORS

1. **Clear browser cache**: `Ctrl + Shift + Delete`
2. **Check function is deployed**: `supabase functions list`
3. **Check function logs**: Look for any errors
4. **Verify CORS headers**: The function should return `status: 204` for OPTIONS

## 📋 DEPLOYMENT CHECKLIST

- [ ] Supabase CLI installed (`supabase --version`)
- [ ] Logged in (`supabase login`)
- [ ] Project linked (`supabase link`)
- [ ] Function deployed (`supabase functions deploy assess-skill`)
- [ ] Secret set (`supabase secrets set gemini_api_key=xxx`)
- [ ] Browser cache cleared
- [ ] Hard refresh done (`Ctrl + Shift + R`)

## 🎯 EXPECTED RESULT

After deployment:
- ✅ No CORS errors in console
- ✅ Function calls succeed
- ✅ Either gets Gemini questions OR gracefully falls back to hardcoded questions
- ✅ No `ERR_FAILED` network errors

