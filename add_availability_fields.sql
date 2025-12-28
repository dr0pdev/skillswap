-- ============================================
-- ADD AVAILABILITY & SCHEDULING FIELDS
-- Migration for hours allocation and time preferences
-- ============================================

-- Add time preference fields to swap_participants
-- These fields are already in the schema but let's ensure they exist

ALTER TABLE swap_participants 
ADD COLUMN IF NOT EXISTS preferred_days JSONB,
ADD COLUMN IF NOT EXISTS preferred_times JSONB;

-- Add comments for documentation
COMMENT ON COLUMN swap_participants.teaching_hours_per_week IS 'Hours per week committed to teaching this skill';
COMMENT ON COLUMN swap_participants.learning_hours_per_week IS 'Hours per week committed to learning this skill';
COMMENT ON COLUMN swap_participants.preferred_days IS 'JSON array of preferred days: ["weekdays", "weekends", "flexible"]';
COMMENT ON COLUMN swap_participants.preferred_times IS 'JSON array of preferred times: ["morning", "afternoon", "evening", "flexible"]';

-- Create index for faster capacity queries
CREATE INDEX IF NOT EXISTS idx_swap_participants_teaching_skill 
ON swap_participants(user_id, teaching_skill_id, teaching_hours_per_week);

CREATE INDEX IF NOT EXISTS idx_swap_participants_learning_skill 
ON swap_participants(user_id, learning_skill_id, learning_hours_per_week);

-- Verify the schema
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'swap_participants'
  AND column_name IN ('teaching_hours_per_week', 'learning_hours_per_week', 'preferred_days', 'preferred_times')
ORDER BY ordinal_position;

