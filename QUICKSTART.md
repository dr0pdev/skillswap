# 🚀 Quick Start Guide

Get Skill Swap running in 5 minutes!

## ✅ Prerequisites

- Node.js 18+ installed
- Supabase account (free tier)
- Your `.env` file configured

## 📝 Steps

### 1. Database Setup (2 minutes)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for project to initialize (~2 minutes)
3. Go to **SQL Editor** → **New Query**
4. Copy all content from `supabase/migrations/00001_initial_schema.sql`
5. Paste and click **Run**

### 2. Get Your Credentials (1 minute)

1. Go to **Project Settings** → **API**
2. Copy:
   - **Project URL**
   - **anon public key** (starts with `eyJ...`)

### 3. Configure Environment (30 seconds)

Update your `.env` file:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR...
GEMINI_API_KEY=AIzaSy... (optional)
```

### 4. Install & Run (1 minute)

```bash
# Install dependencies (if not already done)
npm install

# Start the dev server
npm run dev
```

### 5. Test the App (1 minute)

1. Open [http://localhost:5173](http://localhost:5173)
2. Click **Sign Up**
3. Create an account
4. Add a skill you can teach
5. Add a skill you want to learn
6. Go to **Find Swaps**

## ✨ What's Working

✅ User authentication (sign up/login)  
✅ Profile management  
✅ Add teaching/learning skills  
✅ AI skill assessment (client-side)  
✅ Fair matching algorithm  
✅ Propose swaps  
✅ Accept/decline swaps  
✅ Reputation tracking  
✅ Row Level Security (RLS)  

## 🤖 AI Assessment

The AI assessment currently runs **client-side** with a rule-based algorithm. To enable **real AI via Gemini**:

1. Get a Gemini API key from [ai.google.dev](https://ai.google.dev)
2. Deploy the Edge Function:
   ```bash
   supabase functions deploy assess-skill
   supabase secrets set GEMINI_API_KEY=your_key
   ```
3. Update `src/components/skills/AIAssessment.jsx` to call the Edge Function

## 🎯 Next Steps

- **Add more skills** to the database (edit seed data in migration)
- **Invite friends** to test matching
- **Deploy to production** (see DEPLOYMENT.md)
- **Customize UI** (edit Tailwind classes)

## 🐛 Troubleshooting

### "Supabase connection failed"
- Check your `.env` file has correct credentials
- Verify Supabase project is active
- Check browser console for errors

### "No matches found"
- Add at least one teaching skill AND one learning skill
- Check if other users exist in database
- Fairness threshold is 60+ (lower it in code if testing)

### "Can't add skill"
- Verify database migration ran successfully
- Check Table Editor has `user_skills` table
- Look for RLS policy errors in Supabase logs

## 📚 Learn More

- **Architecture**: See README.md for detailed explanation
- **Database Schema**: See `supabase/migrations/00001_initial_schema.sql`
- **Matching Logic**: See `src/utils/matching.js`
- **Deployment**: See DEPLOYMENT.md

## 💡 Tips

1. **Test with multiple accounts** - Use different browsers or incognito mode
2. **Check Supabase Table Editor** - View data in real-time
3. **Use browser DevTools** - Network tab shows API calls
4. **Read RLS policies** - Understand security model

---

**Happy skill swapping! 🎓🔄📚**

Questions? Check the README.md for full documentation.

