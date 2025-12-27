# Skill Swap

**Fair and transparent skill exchange platform powered by explainable AI**

Skill Swap is an AI-assisted skill exchange platform that fixes the core flaw in traditional skill-swap systems: unfair and exploitative exchanges. It uses deterministic fairness rules combined with AI guidance to create balanced, trustworthy skill exchanges.

## 🎯 Key Features

- **Fair Matching Algorithm**: Calculates skill value based on difficulty, demand, experience level, and reputation
- **AI Skill Assessment**: Optional AI-powered assessment (via OpenRouter) to help users accurately self-report their skill levels
- **Transparent Fairness**: Every match includes an explainable fairness score (0-100) and plain-English explanation
- **Reputation System**: Build trust through completed swaps and peer ratings
- **Multi-user Swaps**: Support for direct (2-person) and cycle (3+ person) skill exchanges
- **Row Level Security**: Database-level security ensures users can only access their own data

## 🏗️ Architecture

### Frontend
- **Vite + React** - Fast, modern development
- **Tailwind CSS** - Beautiful, responsive UI
- **React Router** - Client-side routing
- **Supabase JS Client** - Real-time database and auth

### Backend
- **Supabase Postgres** - Structured data with RLS policies
- **Supabase Auth** - Email/password authentication
- **Supabase Edge Functions** - Serverless TypeScript functions for AI calls
- **OpenRouter API** - AI skill assessment (advisory only, supports multiple models)

### Key Principle
**No separate backend server** - Everything runs on Supabase infrastructure.

## 📊 Database Schema

Core tables:
- `users` - User profiles and reputation scores
- `skills` - Global skill catalog with demand tracking
- `user_skills` - What users teach/learn with AI assessments
- `swaps` - Exchange agreements with fairness scores
- `swap_participants` - Detailed participation records
- `ratings` - Post-swap feedback
- `messages` - Swap-specific communication
- `notifications` - User alerts

See `supabase/migrations/00001_initial_schema.sql` for complete schema.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier works)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd skillswap
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Set up database**

- Go to your Supabase project dashboard
- Navigate to SQL Editor
- Run the migration from `supabase/migrations/00001_initial_schema.sql`

5. **Deploy Edge Functions** (optional, for AI assessment)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy assess-skill

# Set environment variables (see OPENROUTER_SETUP.md for details)
supabase secrets set OPENROUTER_API_KEY=your_key
# Optional: Set a specific model (defaults to openai/gpt-3.5-turbo)
supabase secrets set OPENROUTER_MODEL=openai/gpt-3.5-turbo
```

6. **Run the development server**

```bash
npm run dev
```

Visit `http://localhost:5173` to see the app!

## 🧪 Testing with Sample Users

Since this uses Supabase Auth, **NO pre-created test accounts exist**. You need to create accounts yourself:

### Quick Test Setup:

1. **Create test users** through the signup page:
   - **Email:** `alice@example.com` | **Password:** `TestPass123!`
   - **Email:** `bob@example.com` | **Password:** `TestPass123!`
   - **Email:** `charlie@example.com` | **Password:** `TestPass123!`

2. **Add sample data** (optional):
   - Go to Supabase SQL Editor
   - Run the script from `seed_test_users.sql`
   - This adds profiles and skills for the test users above

3. **Login and test**:
   - Use any of the accounts above
   - Add skills you can teach/learn
   - Check "Find Swaps" to see matches

**OR** just create your own account with any email/password and start adding skills!

## 🎓 How It Works

### 1. Add Skills
Users add skills they can teach and want to learn. Optional AI assessment helps determine accurate skill levels.

### 2. Fair Matching
The algorithm finds potential swaps by:
- Matching complementary skills (you teach what they want to learn)
- Calculating value for each skill based on:
  - Difficulty score (0-100)
  - Market demand (0-100)
  - User's skill level (beginner/intermediate/advanced)
  - Weekly hours available
  - User reputation (0-100)
- Computing fairness score (must be ≥60 to show)
- Generating plain-English explanations

### 3. Propose & Accept
Users propose swaps to matches. Both parties must accept for the swap to become active.

### 4. Complete & Rate
After completing swaps, users rate each other. Ratings update reputation scores automatically.

## 🤖 AI Usage

### Advisory, Not Enforced
AI helps users self-assess their skill levels but **never makes final decisions**. Users always confirm or override AI suggestions.

### OpenRouter Integration
The AI assessment:
1. Asks 4 structured questions about experience (generated dynamically by AI)
2. Sends answers to OpenRouter API (supports multiple AI models)
3. Receives suggested level, difficulty, and explanation
4. User reviews and can modify before saving

### Fallback Logic
If OpenRouter API is unavailable, a rule-based assessment provides suggestions.

## ⚖️ Fairness Algorithm

### Value Calculation
```
SkillValue = (
  difficulty × 0.30 +
  demand × 0.25 +
  reputation × 0.20 +
  min(hours × 10, 50) × 0.25
) × levelMultiplier

levelMultiplier:
- Beginner: 0.7
- Intermediate: 1.0
- Advanced: 1.4
```

### Fairness Score
```
FairnessScore = (min(value1, value2) / max(value1, value2)) × 100
```

**Thresholds:**
- 90-100: Excellent match
- 75-89: Good match
- 60-74: Fair match
- <60: Not shown (too imbalanced)

## 🔒 Security

### Row Level Security (RLS)
Every table has RLS policies ensuring:
- Users can only modify their own data
- Swap details visible only to participants
- Ratings allowed only after swap completion
- Public skill catalog, private user skills

### Authentication Flow
1. User signs up via Supabase Auth
2. Profile automatically created in `users` table
3. Session managed client-side via Supabase JS
4. `auth.uid()` automatically injected into database queries
5. RLS policies enforce access control

## 📱 UI Components

- **Dashboard** - Overview stats and quick actions
- **Skills** - Manage teaching/learning skills
- **Find Swaps** - Browse fair matches with explanations
- **My Swaps** - Track active and completed exchanges
- **Profile** - View reputation and update info

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| Frontend Framework | React 19 |
| Build Tool | Vite 7 |
| Styling | Tailwind CSS 3 |
| Routing | React Router 6 |
| Backend | Supabase (Postgres + Auth + Edge Functions) |
| AI | OpenRouter API (supports multiple models) |
| Language | JavaScript/TypeScript |

## 📈 Future Enhancements

- [ ] Multi-user swap cycles (3+ people)
- [ ] Calendar integration for scheduling
- [ ] Video call integration
- [ ] Achievement badges
- [ ] Skill verification through projects
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)

## 🤝 Contributing

This is a hackathon/demo project. Feel free to fork and adapt for your needs!

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Supabase for the amazing backend platform
- OpenRouter for unified AI model access
- Tailwind CSS for beautiful styling
- React team for the incredible framework

---

**Built with ❤️ for fair skill exchanges**
