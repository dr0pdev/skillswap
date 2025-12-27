-- ============================================
-- SKILL SWAP DATABASE SCHEMA
-- ============================================
-- This schema supports:
-- - Supabase Auth integration
-- - Fair skill exchange matching
-- - AI-assisted skill assessment
-- - Reputation system
-- - Multi-user swap cycles
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  bio TEXT,
  location TEXT,
  timezone TEXT,
  profile_image_url TEXT,
  
  -- Reputation system
  reputation_score DECIMAL(5,2) DEFAULT 50.00 CHECK (reputation_score >= 0 AND reputation_score <= 100),
  total_swaps_completed INTEGER DEFAULT 0,
  total_hours_taught DECIMAL(8,2) DEFAULT 0,
  total_hours_learned DECIMAL(8,2) DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. SKILLS TABLE (global skill catalog)
-- ============================================
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- e.g., 'programming', 'design', 'music', 'language'
  description TEXT,
  
  -- Demand tracking (updated over time)
  demand_score DECIMAL(5,2) DEFAULT 50.00 CHECK (demand_score >= 0 AND demand_score <= 100),
  people_wanting_to_learn INTEGER DEFAULT 0,
  people_able_to_teach INTEGER DEFAULT 0,
  
  -- Base difficulty (set by admin/system)
  base_difficulty DECIMAL(5,2) DEFAULT 50.00 CHECK (base_difficulty >= 0 AND base_difficulty <= 100),
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. USER_SKILLS TABLE (what users can teach/learn)
-- ============================================
CREATE TABLE public.user_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  
  -- Role: 'teach' or 'learn'
  role TEXT NOT NULL CHECK (role IN ('teach', 'learn')),
  
  -- Skill level (for teaching)
  level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  
  -- User-confirmed values
  difficulty_score DECIMAL(5,2) CHECK (difficulty_score >= 0 AND difficulty_score <= 100),
  weekly_hours_available DECIMAL(4,2) DEFAULT 0,
  
  -- AI assessment (optional, advisory only)
  ai_suggested_level TEXT,
  ai_suggested_difficulty DECIMAL(5,2),
  ai_explanation TEXT,
  ai_assessed_at TIMESTAMPTZ,
  
  -- Preferences
  preferred_format TEXT, -- 'online', 'in-person', 'both'
  notes TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, skill_id, role),
  CHECK (
    (role = 'teach' AND level IS NOT NULL AND difficulty_score IS NOT NULL) OR
    (role = 'learn')
  )
);

-- ============================================
-- 4. SWAPS TABLE (skill exchange agreements)
-- ============================================
CREATE TABLE public.swaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Swap type: 'direct' (2 users) or 'cycle' (3+ users)
  swap_type TEXT NOT NULL CHECK (swap_type IN ('direct', 'cycle')),
  
  -- Status lifecycle
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (
    status IN ('proposed', 'accepted', 'active', 'completed', 'cancelled', 'disputed')
  ),
  
  -- Fairness metadata
  fairness_score DECIMAL(5,2) CHECK (fairness_score >= 0 AND fairness_score <= 100),
  balance_explanation TEXT,
  
  -- Schedule
  start_date DATE,
  end_date DATE,
  total_weeks INTEGER,
  
  -- Timestamps
  proposed_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. SWAP_PARTICIPANTS TABLE (who's in each swap)
-- ============================================
CREATE TABLE public.swap_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  swap_id UUID NOT NULL REFERENCES public.swaps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- What this user teaches in this swap
  teaching_skill_id UUID REFERENCES public.skills(id),
  teaching_user_skill_id UUID REFERENCES public.user_skills(id),
  teaching_hours_per_week DECIMAL(4,2),
  
  -- What this user learns in this swap
  learning_skill_id UUID REFERENCES public.skills(id),
  learning_from_user_id UUID REFERENCES public.users(id),
  learning_hours_per_week DECIMAL(4,2),
  
  -- Value calculation
  giving_value DECIMAL(8,2), -- calculated value contribution
  receiving_value DECIMAL(8,2), -- calculated value received
  
  -- Participant status
  has_accepted BOOLEAN DEFAULT false,
  accepted_at TIMESTAMPTZ,
  
  -- Tracking
  actual_hours_taught DECIMAL(8,2) DEFAULT 0,
  actual_hours_learned DECIMAL(8,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(swap_id, user_id)
);

-- ============================================
-- 6. RATINGS TABLE (post-swap feedback)
-- ============================================
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  swap_id UUID NOT NULL REFERENCES public.swaps(id) ON DELETE CASCADE,
  
  -- Who rated whom
  rater_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rated_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Rating scores (1-5)
  skill_quality_score INTEGER CHECK (skill_quality_score >= 1 AND skill_quality_score <= 5),
  communication_score INTEGER CHECK (communication_score >= 1 AND communication_score <= 5),
  reliability_score INTEGER CHECK (reliability_score >= 1 AND reliability_score <= 5),
  overall_score INTEGER CHECK (overall_score >= 1 AND overall_score <= 5),
  
  -- Feedback
  comment TEXT,
  would_swap_again BOOLEAN,
  
  -- Flags
  is_disputed BOOLEAN DEFAULT false,
  dispute_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Each user can only rate another user once per swap
  UNIQUE(swap_id, rater_id, rated_user_id),
  -- Can't rate yourself
  CHECK (rater_id != rated_user_id)
);

-- ============================================
-- 7. MESSAGES TABLE (swap-specific communication)
-- ============================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  swap_id UUID NOT NULL REFERENCES public.swaps(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system')),
  
  -- Read tracking
  read_by UUID[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL, -- 'swap_proposal', 'swap_accepted', 'message', 'rating', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Related entities
  swap_id UUID REFERENCES public.swaps(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Users
CREATE INDEX idx_users_reputation ON public.users(reputation_score DESC);
CREATE INDEX idx_users_active ON public.users(is_active) WHERE is_active = true;

-- Skills
CREATE INDEX idx_skills_category ON public.skills(category);
CREATE INDEX idx_skills_demand ON public.skills(demand_score DESC);
CREATE INDEX idx_skills_active ON public.skills(is_active) WHERE is_active = true;

-- User Skills
CREATE INDEX idx_user_skills_user ON public.user_skills(user_id);
CREATE INDEX idx_user_skills_skill ON public.user_skills(skill_id);
CREATE INDEX idx_user_skills_role ON public.user_skills(role);
CREATE INDEX idx_user_skills_active ON public.user_skills(is_active, role) WHERE is_active = true;

-- Swaps
CREATE INDEX idx_swaps_status ON public.swaps(status);
CREATE INDEX idx_swaps_type ON public.swaps(swap_type);
CREATE INDEX idx_swaps_dates ON public.swaps(start_date, end_date);

-- Swap Participants
CREATE INDEX idx_swap_participants_swap ON public.swap_participants(swap_id);
CREATE INDEX idx_swap_participants_user ON public.swap_participants(user_id);
CREATE INDEX idx_swap_participants_teaching ON public.swap_participants(teaching_skill_id);
CREATE INDEX idx_swap_participants_learning ON public.swap_participants(learning_skill_id);

-- Ratings
CREATE INDEX idx_ratings_swap ON public.ratings(swap_id);
CREATE INDEX idx_ratings_rated_user ON public.ratings(rated_user_id);

-- Messages
CREATE INDEX idx_messages_swap ON public.messages(swap_id, created_at DESC);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);

-- Notifications
CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_skills_updated_at
  BEFORE UPDATE ON public.skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_skills_updated_at
  BEFORE UPDATE ON public.user_skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_swaps_updated_at
  BEFORE UPDATE ON public.swaps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_swap_participants_updated_at
  BEFORE UPDATE ON public.swap_participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to update user reputation after rating
CREATE OR REPLACE FUNCTION update_user_reputation()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate reputation based on all ratings
  UPDATE public.users
  SET reputation_score = (
    SELECT COALESCE(AVG(overall_score) * 20, 50) -- Convert 1-5 scale to 0-100
    FROM public.ratings
    WHERE rated_user_id = NEW.rated_user_id
  )
  WHERE id = NEW.rated_user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reputation_after_rating
  AFTER INSERT OR UPDATE ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION update_user_reputation();

-- Function to update skill demand scores
CREATE OR REPLACE FUNCTION update_skill_demand()
RETURNS TRIGGER AS $$
BEGIN
  -- Update demand based on learners vs teachers ratio
  UPDATE public.skills
  SET 
    people_wanting_to_learn = (
      SELECT COUNT(*) FROM public.user_skills 
      WHERE skill_id = COALESCE(NEW.skill_id, OLD.skill_id) 
      AND role = 'learn' AND is_active = true
    ),
    people_able_to_teach = (
      SELECT COUNT(*) FROM public.user_skills 
      WHERE skill_id = COALESCE(NEW.skill_id, OLD.skill_id) 
      AND role = 'teach' AND is_active = true
    ),
    demand_score = CASE
      WHEN (SELECT COUNT(*) FROM public.user_skills 
            WHERE skill_id = COALESCE(NEW.skill_id, OLD.skill_id) 
            AND role = 'teach' AND is_active = true) = 0
      THEN 100
      ELSE LEAST(100, (
        SELECT COUNT(*) FROM public.user_skills 
        WHERE skill_id = COALESCE(NEW.skill_id, OLD.skill_id) 
        AND role = 'learn' AND is_active = true
      )::DECIMAL / NULLIF((
        SELECT COUNT(*) FROM public.user_skills 
        WHERE skill_id = COALESCE(NEW.skill_id, OLD.skill_id) 
        AND role = 'teach' AND is_active = true
      ), 0) * 50)
    END
  WHERE id = COALESCE(NEW.skill_id, OLD.skill_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_demand_after_user_skill
  AFTER INSERT OR UPDATE OR DELETE ON public.user_skills
  FOR EACH ROW EXECUTE FUNCTION update_skill_demand();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swap_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Users can read all public user profiles
CREATE POLICY "Users can view all profiles"
  ON public.users FOR SELECT
  USING (true);

-- Users can update only their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- SKILLS TABLE POLICIES
-- ============================================

-- Everyone can read active skills
CREATE POLICY "Anyone can view active skills"
  ON public.skills FOR SELECT
  USING (is_active = true);

-- Only authenticated users can suggest skills (admin approval needed)
CREATE POLICY "Authenticated users can suggest skills"
  ON public.skills FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- USER_SKILLS TABLE POLICIES
-- ============================================

-- Users can view active user_skills (for matching)
CREATE POLICY "Users can view active user skills"
  ON public.user_skills FOR SELECT
  USING (is_active = true);

-- Users can manage their own skills
CREATE POLICY "Users can manage own skills"
  ON public.user_skills FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- SWAPS TABLE POLICIES
-- ============================================

-- Users can view swaps they're part of
CREATE POLICY "Users can view their swaps"
  ON public.swaps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.swap_participants
      WHERE swap_participants.swap_id = swaps.id
      AND swap_participants.user_id = auth.uid()
    )
  );

-- Users can create swap proposals (matching algorithm creates these)
CREATE POLICY "Users can create swaps"
  ON public.swaps FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update swaps they're part of
CREATE POLICY "Users can update their swaps"
  ON public.swaps FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.swap_participants
      WHERE swap_participants.swap_id = swaps.id
      AND swap_participants.user_id = auth.uid()
    )
  );

-- ============================================
-- SWAP_PARTICIPANTS TABLE POLICIES
-- ============================================

-- Users can view swap participants for their swaps
CREATE POLICY "Users can view swap participants"
  ON public.swap_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.swap_participants sp
      WHERE sp.swap_id = swap_participants.swap_id
      AND sp.user_id = auth.uid()
    )
  );

-- System/Edge Functions can create participants
CREATE POLICY "Authenticated users can create swap participants"
  ON public.swap_participants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own participation
CREATE POLICY "Users can update own participation"
  ON public.swap_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- RATINGS TABLE POLICIES
-- ============================================

-- Users can view ratings for completed swaps they were part of
CREATE POLICY "Users can view swap ratings"
  ON public.ratings FOR SELECT
  USING (
    auth.uid() = rater_id OR 
    auth.uid() = rated_user_id OR
    EXISTS (
      SELECT 1 FROM public.swap_participants
      WHERE swap_participants.swap_id = ratings.swap_id
      AND swap_participants.user_id = auth.uid()
    )
  );

-- Users can create ratings only for completed swaps
CREATE POLICY "Users can rate completed swaps"
  ON public.ratings FOR INSERT
  WITH CHECK (
    auth.uid() = rater_id AND
    EXISTS (
      SELECT 1 FROM public.swaps s
      JOIN public.swap_participants sp ON sp.swap_id = s.id
      WHERE s.id = swap_id
      AND s.status = 'completed'
      AND sp.user_id = auth.uid()
    )
  );

-- ============================================
-- MESSAGES TABLE POLICIES
-- ============================================

-- Users can view messages in their swaps
CREATE POLICY "Users can view swap messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.swap_participants
      WHERE swap_participants.swap_id = messages.swap_id
      AND swap_participants.user_id = auth.uid()
    )
  );

-- Users can send messages in their swaps
CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.swap_participants
      WHERE swap_participants.swap_id = messages.swap_id
      AND swap_participants.user_id = auth.uid()
    )
  );

-- Users can update their own messages (for read tracking)
CREATE POLICY "Users can update messages"
  ON public.messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.swap_participants
      WHERE swap_participants.swap_id = messages.swap_id
      AND swap_participants.user_id = auth.uid()
    )
  );

-- ============================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- System can create notifications
CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- SEED DATA (Optional - common skills)
-- ============================================

INSERT INTO public.skills (name, category, description, base_difficulty) VALUES
  -- Programming
  ('Python', 'programming', 'General-purpose programming language', 40),
  ('JavaScript', 'programming', 'Web development programming language', 45),
  ('React', 'programming', 'JavaScript library for building UIs', 60),
  ('SQL', 'programming', 'Database query language', 35),
  
  -- Design
  ('Figma', 'design', 'UI/UX design tool', 50),
  ('Photoshop', 'design', 'Image editing software', 55),
  ('Graphic Design', 'design', 'Visual communication design', 65),
  
  -- Languages
  ('Spanish', 'language', 'Spanish language learning', 70),
  ('French', 'language', 'French language learning', 70),
  ('Mandarin Chinese', 'language', 'Mandarin Chinese language', 85),
  
  -- Music
  ('Guitar', 'music', 'Acoustic or electric guitar', 60),
  ('Piano', 'music', 'Piano/keyboard', 65),
  ('Music Theory', 'music', 'Understanding music fundamentals', 70),
  
  -- Other
  ('Cooking', 'lifestyle', 'Culinary skills', 45),
  ('Photography', 'creative', 'Digital photography', 55),
  ('Writing', 'creative', 'Creative or technical writing', 60)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- COMPLETED!
-- ============================================