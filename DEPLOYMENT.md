# Deployment Guide

## Deploying Skill Swap to Production

### Prerequisites

- Supabase project (free or paid tier)
- Vercel/Netlify account (for frontend) or any static hosting
- Gemini API key (optional, for AI features)

---

## 1. Set Up Supabase

### Create a New Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details
4. Wait for project to be created (~2 minutes)

### Get Your Credentials

1. Go to **Project Settings** → **API**
2. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### Run Database Migration

1. Go to **SQL Editor** in your Supabase dashboard
2. Click "New Query"
3. Copy the entire contents of `supabase/migrations/00001_initial_schema.sql`
4. Paste and click "Run"
5. Verify tables are created in **Table Editor**

---

## 2. Configure Authentication

### Email Settings

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email templates if desired
4. For production, set up custom SMTP (optional)

### URL Configuration

1. Go to **Authentication** → **URL Configuration**
2. Add your production URL to:
   - **Site URL**: `https://your-domain.com`
   - **Redirect URLs**: `https://your-domain.com/**`

---

## 3. Deploy Edge Functions (Optional)

### Install Supabase CLI

```bash
npm install -g supabase
```

### Login to Supabase

```bash
supabase login
```

### Link Your Project

```bash
supabase link --project-ref your-project-ref
```

Find your project ref in: **Project Settings** → **General** → **Reference ID**

### Deploy Functions

```bash
supabase functions deploy assess-skill
```

### Set Environment Variables

```bash
supabase secrets set GEMINI_API_KEY=your_gemini_api_key
```

---

## 4. Deploy Frontend

### Option A: Vercel (Recommended)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Configure Environment Variables**

Create a `vercel.json` file:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_SUPABASE_URL": "your_supabase_url",
    "VITE_SUPABASE_ANON_KEY": "your_anon_key"
  }
}
```

3. **Deploy**
```bash
vercel --prod
```

Or connect your GitHub repo to Vercel for automatic deployments.

### Option B: Netlify

1. **Install Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **Build the project**
```bash
npm run build
```

3. **Deploy**
```bash
netlify deploy --prod --dir=dist
```

4. **Set Environment Variables**
   - Go to Netlify dashboard → Site settings → Build & deploy → Environment
   - Add:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

### Option C: Static Hosting (Cloudflare Pages, GitHub Pages, etc.)

1. **Build**
```bash
npm run build
```

2. **Upload `dist/` folder** to your hosting provider

3. **Configure redirects** for SPA routing:

Create `public/_redirects` (Netlify) or `vercel.json` (Vercel):
```
/* /index.html 200
```

---

## 5. Environment Variables

### Production `.env`

**Never commit this file!**

```env
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Gemini API (for Edge Function)
GEMINI_API_KEY=AIzaSy...
```

### Where to Set Them

- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Build & Deploy → Environment
- **Edge Functions**: Use `supabase secrets set`

---

## 6. Post-Deployment Checklist

- [ ] Test user registration
- [ ] Test login/logout
- [ ] Add a test skill
- [ ] Try AI assessment (if Edge Function deployed)
- [ ] Check database in Supabase dashboard
- [ ] Verify RLS policies are working
- [ ] Test finding matches
- [ ] Test proposing a swap
- [ ] Check notifications table

---

## 7. Monitoring & Maintenance

### Supabase Dashboard

- **Database**: Monitor queries and performance
- **Auth**: Track user signups and sessions
- **Logs**: Check Edge Function logs
- **Storage**: Monitor API usage

### Application Monitoring

Consider adding:
- Error tracking (Sentry, LogRocket)
- Analytics (Google Analytics, Plausible)
- Performance monitoring (Vercel Analytics)

---

## 8. Scaling Considerations

### Database

- Add indexes for frequently queried columns
- Consider upgrading Supabase plan for more connections
- Use Supabase realtime subscriptions for live updates

### Edge Functions

- Monitor cold start times
- Consider upgrading for guaranteed uptime
- Cache Gemini API responses when appropriate

### Frontend

- Enable Vercel/Netlify edge caching
- Optimize images (if added later)
- Lazy load components

---

## 9. Security Best Practices

1. **Never expose service_role key** - Use anon key only
2. **Rely on RLS** - All security at database level
3. **Validate inputs** - Use Zod or similar for validation
4. **Rate limiting** - Enable in Supabase settings
5. **Regular backups** - Supabase auto-backups or manual exports

---

## 10. Troubleshooting

### "User not found" on login
- Check Auth email confirmations are disabled (for demo)
- Verify email/password in Supabase Auth dashboard

### "CORS error"
- Add your domain to Supabase allowed origins
- Check Edge Function CORS headers

### "RLS policy violation"
- Check user is authenticated
- Verify policy logic in SQL Editor
- Use Supabase logs to debug

### "API rate limit exceeded"
- Upgrade Supabase plan
- Implement client-side caching
- Reduce unnecessary queries

---

## Support

For issues specific to:
- **Supabase**: Check [supabase.com/docs](https://supabase.com/docs)
- **Vercel**: Visit [vercel.com/docs](https://vercel.com/docs)
- **Gemini API**: See [ai.google.dev](https://ai.google.dev)

Happy deploying! 🚀

