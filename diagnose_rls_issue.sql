-- ============================================
-- DIAGNOSTIC QUERIES FOR RLS ISSUE
-- ============================================
-- Run these queries to understand what's happening with RLS policies

-- ============================================
-- 1. CHECK CURRENT POLICIES ON SWAPS TABLE
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as "Operation",
  roles,
  qual as "Using Clause (for SELECT/UPDATE)",
  with_check as "With Check Clause (for INSERT/UPDATE)"
FROM pg_policies 
WHERE tablename = 'swaps'
ORDER BY cmd, policyname;

-- ============================================
-- 2. CHECK CURRENT POLICIES ON SWAP_PARTICIPANTS TABLE
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as "Operation",
  roles,
  qual as "Using Clause (for SELECT/UPDATE)",
  with_check as "With Check Clause (for INSERT/UPDATE)"
FROM pg_policies 
WHERE tablename = 'swap_participants'
ORDER BY cmd, policyname;

-- ============================================
-- 3. CHECK IF RLS IS ENABLED ON TABLES
-- ============================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename IN ('swaps', 'swap_participants')
AND schemaname = 'public';

-- ============================================
-- 4. CHECK ALL POLICIES (BOTH TABLES TOGETHER)
-- ============================================
SELECT 
  tablename,
  policyname,
  cmd as "Operation",
  roles,
  CASE 
    WHEN cmd = 'INSERT' THEN with_check
    WHEN cmd = 'SELECT' THEN qual
    WHEN cmd = 'UPDATE' THEN COALESCE(qual, '') || ' | ' || COALESCE(with_check, '')
    ELSE qual
  END as "Policy Condition"
FROM pg_policies 
WHERE tablename IN ('swaps', 'swap_participants')
ORDER BY tablename, cmd, policyname;

-- ============================================
-- 5. CHECK FOR DUPLICATE POLICIES
-- ============================================
-- Sometimes duplicate policies can cause conflicts
SELECT 
  tablename,
  policyname,
  cmd,
  COUNT(*) as "Count"
FROM pg_policies 
WHERE tablename IN ('swaps', 'swap_participants')
GROUP BY tablename, policyname, cmd
HAVING COUNT(*) > 1;

-- ============================================
-- 6. CHECK CURRENT AUTHENTICATION CONTEXT
-- ============================================
-- Note: This will show NULL in SQL Editor (runs as postgres role)
-- But it helps verify the query works
SELECT 
  current_user as "Current Database User",
  current_setting('request.jwt.claim.sub', true) as "JWT User ID",
  auth.uid() as "Auth UID",
  auth.uid() IS NOT NULL as "Is Authenticated";

-- ============================================
-- 7. TEST IF INSERT WOULD WORK (SIMULATION)
-- ============================================
-- This won't actually insert, but shows what the policy checks
SELECT 
  'swaps' as table_name,
  'INSERT' as operation,
  auth.uid() IS NOT NULL as "Would Pass Auth Check",
  auth.uid() as "User ID",
  current_user as "Database Role";

-- ============================================
-- 8. CHECK POLICY PERMISSIONS BY ROLE
-- ============================================
SELECT 
  p.tablename,
  p.policyname,
  p.cmd,
  p.roles,
  CASE 
    WHEN 'authenticated' = ANY(p.roles) THEN '✅ Has authenticated role'
    WHEN p.roles IS NULL OR array_length(p.roles, 1) IS NULL THEN '⚠️ No role restriction (applies to all)'
    ELSE '❌ Does NOT have authenticated role'
  END as "Role Check"
FROM pg_policies p
WHERE p.tablename IN ('swaps', 'swap_participants')
ORDER BY p.tablename, p.cmd;

-- ============================================
-- 9. CHECK FOR CONFLICTING POLICIES
-- ============================================
-- Multiple INSERT policies might conflict
SELECT 
  tablename,
  cmd,
  COUNT(*) as "Policy Count",
  array_agg(policyname) as "Policy Names"
FROM pg_policies 
WHERE tablename IN ('swaps', 'swap_participants')
AND cmd = 'INSERT'
GROUP BY tablename, cmd
HAVING COUNT(*) > 1;

-- ============================================
-- 10. VERIFY TABLE STRUCTURE
-- ============================================
-- Make sure required columns exist
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'swaps'
ORDER BY ordinal_position;

-- ============================================
-- INTERPRETATION GUIDE
-- ============================================
-- After running these queries, check:
--
-- 1. Query 1 & 2: Do INSERT policies exist for swaps and swap_participants?
--    - Should see at least one INSERT policy for each table
--    - Should have 'authenticated' in roles column
--
-- 2. Query 3: Is RLS enabled?
--    - Should show "RLS Enabled" = true for both tables
--
-- 3. Query 4: What are the policy conditions?
--    - INSERT policies should have a WITH CHECK clause
--    - Should be permissive enough (like WITH CHECK (true) or WITH CHECK (auth.uid() IS NOT NULL))
--
-- 4. Query 5: Are there duplicate policies?
--    - Should return 0 rows (no duplicates)
--    - If duplicates exist, they need to be dropped
--
-- 5. Query 6: Auth context (will be NULL in SQL Editor - this is normal)
--    - In SQL Editor: current_user = 'postgres', auth.uid() = NULL (expected)
--    - In web app: current_user = 'authenticated', auth.uid() = your user ID
--
-- 6. Query 8: Do policies have 'authenticated' role?
--    - INSERT policies MUST have 'authenticated' in roles
--    - If not, that's the problem!
--
-- 7. Query 9: Are there multiple INSERT policies?
--    - Should have exactly 1 INSERT policy per table
--    - Multiple policies might conflict
--
-- 8. Query 10: Verify table structure
--    - Make sure swap_type, status, fairness_score columns exist
-- ============================================

