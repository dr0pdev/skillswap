-- ============================================
-- HOURLY SCHEDULING SYSTEM
-- Store specific time slots for swap sessions
-- ============================================

-- Create scheduled_sessions table
CREATE TABLE IF NOT EXISTS scheduled_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  swap_id UUID NOT NULL REFERENCES swaps(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES swap_participants(id) ON DELETE CASCADE,
  
  -- Who is teaching/learning in this session
  teacher_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  learner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  
  -- Scheduling details
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  
  -- Session metadata
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  location_type VARCHAR(20) DEFAULT 'online' CHECK (location_type IN ('online', 'in-person', 'hybrid')),
  meeting_link TEXT,
  notes TEXT,
  
  -- Completion tracking
  completed_at TIMESTAMPTZ,
  teacher_rating INTEGER CHECK (teacher_rating >= 1 AND teacher_rating <= 5),
  learner_rating INTEGER CHECK (learner_rating >= 1 AND learner_rating <= 5),
  teacher_feedback TEXT,
  learner_feedback TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_duration CHECK (duration_minutes > 0 AND duration_minutes <= 480), -- Max 8 hours
  CONSTRAINT no_overlap UNIQUE (teacher_user_id, session_date, start_time, end_time)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_swap ON scheduled_sessions(swap_id);
CREATE INDEX IF NOT EXISTS idx_sessions_teacher ON scheduled_sessions(teacher_user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_sessions_learner ON scheduled_sessions(learner_user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON scheduled_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON scheduled_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_skill ON scheduled_sessions(skill_id);

-- Enable Row Level Security
ALTER TABLE scheduled_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own sessions" ON scheduled_sessions;
DROP POLICY IF EXISTS "Users can create sessions for their swaps" ON scheduled_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON scheduled_sessions;

-- RLS Policies
CREATE POLICY "Users can view their own sessions"
ON scheduled_sessions FOR SELECT
TO authenticated
USING (teacher_user_id = auth.uid() OR learner_user_id = auth.uid());

CREATE POLICY "Users can create sessions for their swaps"
ON scheduled_sessions FOR INSERT
TO authenticated
WITH CHECK (
  (teacher_user_id = auth.uid() OR learner_user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM swap_participants
    WHERE swap_participants.swap_id = scheduled_sessions.swap_id
    AND swap_participants.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own sessions"
ON scheduled_sessions FOR UPDATE
TO authenticated
USING (teacher_user_id = auth.uid() OR learner_user_id = auth.uid());

-- Function to check for scheduling conflicts
CREATE OR REPLACE FUNCTION check_scheduling_conflict(
  p_user_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_session_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO conflict_count
  FROM scheduled_sessions
  WHERE (teacher_user_id = p_user_id OR learner_user_id = p_user_id)
    AND session_date = p_date
    AND status NOT IN ('cancelled', 'rescheduled')
    AND (p_session_id IS NULL OR id != p_session_id)
    AND (
      -- Check for any overlap
      (start_time < p_end_time AND end_time > p_start_time)
    );
  
  RETURN conflict_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate total hours scheduled for a user on a date
CREATE OR REPLACE FUNCTION get_daily_hours(
  p_user_id UUID,
  p_date DATE
)
RETURNS NUMERIC AS $$
DECLARE
  total_minutes INTEGER;
BEGIN
  SELECT COALESCE(SUM(duration_minutes), 0) INTO total_minutes
  FROM scheduled_sessions
  WHERE (teacher_user_id = p_user_id OR learner_user_id = p_user_id)
    AND session_date = p_date
    AND status = 'scheduled';
  
  RETURN total_minutes / 60.0;
END;
$$ LANGUAGE plpgsql;

-- Function to get weekly hours for a user
CREATE OR REPLACE FUNCTION get_weekly_hours(
  p_user_id UUID,
  p_start_date DATE
)
RETURNS TABLE (
  date DATE,
  teaching_hours NUMERIC,
  learning_hours NUMERIC,
  total_hours NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    session_date AS date,
    COALESCE(SUM(CASE WHEN teacher_user_id = p_user_id THEN duration_minutes ELSE 0 END) / 60.0, 0) AS teaching_hours,
    COALESCE(SUM(CASE WHEN learner_user_id = p_user_id THEN duration_minutes ELSE 0 END) / 60.0, 0) AS learning_hours,
    COALESCE(SUM(duration_minutes) / 60.0, 0) AS total_hours
  FROM scheduled_sessions
  WHERE (teacher_user_id = p_user_id OR learner_user_id = p_user_id)
    AND session_date >= p_start_date
    AND session_date < p_start_date + INTERVAL '7 days'
    AND status = 'scheduled'
  GROUP BY session_date
  ORDER BY session_date;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_session_timestamp ON scheduled_sessions;
CREATE TRIGGER trigger_update_session_timestamp
BEFORE UPDATE ON scheduled_sessions
FOR EACH ROW
EXECUTE FUNCTION update_session_updated_at();

-- Enable realtime for sessions
ALTER PUBLICATION supabase_realtime ADD TABLE scheduled_sessions;

-- Comments
COMMENT ON TABLE scheduled_sessions IS 'Specific time slots for skill swap sessions';
COMMENT ON COLUMN scheduled_sessions.duration_minutes IS 'Session duration in minutes';
COMMENT ON COLUMN scheduled_sessions.status IS 'Current status: scheduled, completed, cancelled, rescheduled';
COMMENT ON COLUMN scheduled_sessions.location_type IS 'Where the session takes place';
COMMENT ON COLUMN scheduled_sessions.meeting_link IS 'Video call link or location details';

-- Verification
SELECT 'Scheduling system created successfully!' AS status;

SELECT 
  COUNT(*) AS total_sessions,
  COUNT(DISTINCT teacher_user_id) AS unique_teachers,
  COUNT(DISTINCT learner_user_id) AS unique_learners
FROM scheduled_sessions;

