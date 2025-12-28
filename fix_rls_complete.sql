-- ============================================
-- COMPLETE RLS FIX FOR SWAPS & SWAP_PARTICIPANTS
-- Based on diagnostic results - policies are correct, but ensuring they're properly set
-- ============================================

-- Step 1: Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can create swaps" ON public.swaps;
DROP POLICY IF EXISTS "Users can view their swaps" ON public.swaps;
DROP POLICY IF EXISTS "Users can update their swaps" ON public.swaps;
DROP POLICY IF EXISTS "Authenticated users can create swap participants" ON public.swap_participants;
DROP POLICY IF EXISTS "Users can view their swap participants" ON public.swap_participants;
DROP POLICY IF EXISTS "Users can update own participation" ON public.swap_participants;

-- Step 2: Ensure RLS is enabled
ALTER TABLE public.swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swap_participants ENABLE ROW LEVEL SECURITY;

-- Step 3: Recreate policies with explicit role checks

-- SWAPS TABLE POLICIES
-- INSERT: Any authenticated user can create a swap
CREATE POLICY "Users can create swaps"
ON public.swaps
FOR INSERT
TO authenticated
WITH CHECK (true);

-- SELECT: Users can view swaps they're participating in
CREATE POLICY "Users can view their swaps"
ON public.swaps
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.swap_participants
    WHERE swap_participants.swap_id = swaps.id
      AND swap_participants.user_id = auth.uid()
  )
);

-- UPDATE: Users can update swaps they're participating in
CREATE POLICY "Users can update their swaps"
ON public.swaps
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.swap_participants
    WHERE swap_participants.swap_id = swaps.id
      AND swap_participants.user_id = auth.uid()
  )
);

-- SWAP_PARTICIPANTS TABLE POLICIES
-- INSERT: Any authenticated user can create swap participants
CREATE POLICY "Authenticated users can create swap participants"
ON public.swap_participants
FOR INSERT
TO authenticated
WITH CHECK (true);

-- SELECT: Users can view their own participation records
CREATE POLICY "Users can view their swap participants"
ON public.swap_participants
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- UPDATE: Users can update their own participation
CREATE POLICY "Users can update own participation"
ON public.swap_participants
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  roles,
  qual as "Using Clause",
  with_check as "With Check Clause"
FROM pg_policies
WHERE tablename IN ('swaps', 'swap_participants')
ORDER BY tablename, cmd;

-- Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename IN ('swaps', 'swap_participants');

-- Test authentication context (will show NULL in SQL Editor - that's normal)
SELECT 
  current_user as "Current Database User",
  current_setting('request.jwt.claim.sub', true) as "JWT User ID",
  auth.uid() as "Auth UID",
  auth.uid() IS NOT NULL as "Is Authenticated";

