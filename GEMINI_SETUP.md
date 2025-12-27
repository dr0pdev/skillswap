# 🔑 Setting Gemini API Key - Visual Guide

## Method 1: Supabase Dashboard (Recommended - No CLI needed!)

### Step-by-Step:

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Login to your account

2. **Select Your Project**
   - Click on your Skill Swap project

3. **Navigate to Settings**
   - Click **Settings** in the left sidebar
   - Click **Edge Functions** tab
   - OR go to **Project Settings** → **Edge Functions**

4. **Manage Secrets**
   - Look for "Function Secrets" or "Environment Variables"
   - Click **"Manage Secrets"** or **"Add Secret"**

5. **Add the Secret**
   - Secret Name: `gemini_api_key` (lowercase works perfectly!)
   - Secret Value: (paste your Gemini API key)
   - Click **Save** or **Add**

6. **Verify**
   - You should see `gemini_api_key` in the list of secrets
   - ✅ Done!

---

## Method 2: CLI (Alternative)

If you prefer command line:

```bash
supabase secrets set GEMINI_API_KEY=your_key_here
```

---

## Get Your Gemini API Key

1. Go to: https://aistudio.google.com/app/apikey
2. Sign in with Google account
3. Click **"Create API Key"**
4. Select **"Create API key in new project"** (or use existing)
5. Copy the key (starts with `AIza...`)

---

## Testing

After setting the secret:

1. Go to your app
2. Add a skill → Click "Get AI Help"
3. Answer the questions
4. If Gemini is working: You'll see detailed, contextual assessment
5. If not working: App uses fallback (still works fine!)

---

## Troubleshooting

**Can't find Edge Functions in Settings?**
- Try: Settings → API → Scroll down to "Edge Functions"
- Or: Project Dashboard → Edge Functions (left sidebar)

**Secret not working?**
- Redeploy the function: `supabase functions deploy assess-skill`
- Wait 30 seconds for changes to take effect
- Clear browser cache and refresh

**Still not working?**
- The app will use fallback calculation automatically
- Users won't see any errors
- Everything still works perfectly!

---

## Why Supabase Dashboard is Easier

✅ Visual interface - no command line needed
✅ See all secrets in one place
✅ Easy to edit/delete later
✅ Works even if CLI isn't configured
✅ No risk of typos in terminal

---

You're all set! 🚀

