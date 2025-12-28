-- ============================================
-- FIX DECLINE PROPOSAL FUNCTIONALITY
-- Add declined_at column and ensure RLS allows updates
-- ============================================

-- Add declined_at column if it doesn't exist
ALTER TABLE swaps 
ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ;

-- Update RLS policy to allow users to decline swaps they're part of
DROP POLICY IF EXISTS "Users can update swaps they're part of" ON swaps;

CREATE POLICY "Users can update swaps they're part of"
ON swaps FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM swap_participants
    WHERE swap_participants.swap_id = swaps.id
    AND swap_participants.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM swap_participants
    WHERE swap_participants.swap_id = swaps.id
    AND swap_participants.user_id = auth.uid()
  )
);

-- Verify the column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'swaps'
  AND column_name = 'declined_at';

