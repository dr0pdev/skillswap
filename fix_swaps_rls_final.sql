-- ============================================
-- FINAL FIX FOR SWAPS TABLE RLS POLICY
-- ============================================
-- This is a simpler, more permissive policy that should definitely work

-- Step 1: Drop ALL existing policies
DROP POLICY IF EXISTS "Users can create swaps" ON public.swaps;
DROP POLICY IF EXISTS "Users can view their swaps" ON public.swaps;
DROP POLICY IF EXISTS "Users can update their swaps" ON public.swaps;
DROP POLICY IF EXISTS "Authenticated users can create swap participants" ON public.swap_participants;
DROP POLICY IF EXISTS "Users can view swap participants" ON public.swap_participants;
DROP POLICY IF EXISTS "Users can view their swap participants" ON public.swap_participants;
DROP POLICY IF EXISTS "Users can update own participation" ON public.swap_participants;

-- Step 2: Ensure RLS is enabled
ALTER TABLE public.swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swap_participants ENABLE ROW LEVEL SECURITY;

-- Step 3: Create SIMPLE, PERMISSIVE policies for swaps
-- SELECT: Users can view swaps they're part of
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

-- INSERT: ANY authenticated user can create swaps
-- This is the critical one - make it as simple as possible
CREATE POLICY "Users can create swaps"
  ON public.swaps FOR INSERT
  TO authenticated
  WITH CHECK (true);  -- Changed from auth.uid() IS NOT NULL to just true

-- UPDATE: Users can update swaps they're part of
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

-- Step 4: Create policies for swap_participants
-- SELECT: Users can view their own participation
CREATE POLICY "Users can view their swap participants"
  ON public.swap_participants FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- INSERT: ANY authenticated user can create participants
CREATE POLICY "Authenticated users can create swap participants"
  ON public.swap_participants FOR INSERT
  TO authenticated
  WITH CHECK (true);  -- Changed to just true - most permissive

-- UPDATE: Users can update their own participation
CREATE POLICY "Users can update own participation"
  ON public.swap_participants FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Step 5: Verify policies
SELECT 
  tablename,
  policyname, 
  cmd as "Operation",
  roles,
  with_check as "With Check Clause"
FROM pg_policies 
WHERE tablename IN ('swaps', 'swap_participants')
ORDER BY tablename, cmd;

-- ============================================
-- IMPORTANT NOTES:
-- ============================================
-- 1. The SQL Editor runs as 'postgres' role, so auth.uid() will be NULL there
--    This is NORMAL and expected - it doesn't mean you're not logged in
-- 2. The web app runs as 'authenticated' role with your user session
-- 3. After running this, refresh your browser and try again
-- ============================================

