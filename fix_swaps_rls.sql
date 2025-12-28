-- ============================================
-- COMPREHENSIVE FIX FOR SWAPS TABLE RLS POLICY
-- ============================================
-- This fixes the "row-level security policy" error when creating swaps

-- Step 1: Check current policies (diagnostic)
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as "Operation",
  roles,
  qual as "Using Clause",
  with_check as "With Check Clause"
FROM pg_policies 
WHERE tablename IN ('swaps', 'swap_participants')
ORDER BY tablename, cmd;

-- Step 2: Drop ALL existing policies on swaps table
DROP POLICY IF EXISTS "Users can create swaps" ON public.swaps;
DROP POLICY IF EXISTS "Users can view their swaps" ON public.swaps;
DROP POLICY IF EXISTS "Users can update their swaps" ON public.swaps;

-- Step 3: Ensure RLS is enabled
ALTER TABLE public.swaps ENABLE ROW LEVEL SECURITY;

-- Step 4: Recreate SELECT policy (users can view swaps they're part of)
CREATE POLICY "Users can view their swaps"
  ON public.swaps FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.swap_participants
      WHERE swap_participants.swap_id = swaps.id
      AND swap_participants.user_id = auth.uid()
    )
  );

-- Step 5: Recreate INSERT policy (authenticated users can create swaps)
-- This is the critical one that was failing
-- Using TO authenticated explicitly ensures only logged-in users can insert
CREATE POLICY "Users can create swaps"
  ON public.swaps FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Step 6: Recreate UPDATE policy (users can update swaps they're part of)
CREATE POLICY "Users can update their swaps"
  ON public.swaps FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.swap_participants
      WHERE swap_participants.swap_id = swaps.id
      AND swap_participants.user_id = auth.uid()
    )
  );

-- Step 7: Fix swap_participants policies
DROP POLICY IF EXISTS "Authenticated users can create swap participants" ON public.swap_participants;
DROP POLICY IF EXISTS "Users can view swap participants" ON public.swap_participants;
DROP POLICY IF EXISTS "Users can view their swap participants" ON public.swap_participants;

-- Ensure RLS is enabled
ALTER TABLE public.swap_participants ENABLE ROW LEVEL SECURITY;

-- Create SELECT policy (non-recursive)
CREATE POLICY "Users can view their swap participants"
  ON public.swap_participants FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create INSERT policy
CREATE POLICY "Authenticated users can create swap participants"
  ON public.swap_participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create UPDATE policy (drop first if exists)
DROP POLICY IF EXISTS "Users can update own participation" ON public.swap_participants;

CREATE POLICY "Users can update own participation"
  ON public.swap_participants FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Step 8: Verify policies were created correctly
SELECT 
  tablename,
  policyname, 
  cmd as "Operation",
  roles,
  qual as "Using Clause",
  with_check as "With Check Clause"
FROM pg_policies 
WHERE tablename IN ('swaps', 'swap_participants')
ORDER BY tablename, cmd;

-- Step 9: Test query (should return true if you're logged in)
SELECT 
  auth.uid() IS NOT NULL as "Is Authenticated",
  auth.uid() as "User ID";

-- ============================================
-- DONE! 
-- ============================================
-- After running this:
-- 1. Check the verification queries above to ensure policies exist
-- 2. Verify "Is Authenticated" returns true
-- 3. Refresh your browser (hard refresh: Ctrl+Shift+R)
-- 4. Try creating a swap proposal again
-- 5. The error should be resolved
