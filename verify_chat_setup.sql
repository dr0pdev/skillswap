-- ============================================
-- VERIFY CHAT SYSTEM SETUP
-- Check if chat tables and functions exist
-- ============================================

-- Check if chat_threads table exists
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'chat_threads'
ORDER BY ordinal_position;

-- Check if chat_messages table exists
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'chat_messages'
ORDER BY ordinal_position;

-- Check if get_or_create_thread function exists
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'get_or_create_thread'
  AND routine_schema = 'public';

-- Test the function (replace with actual user IDs)
-- SELECT get_or_create_thread(
--   'user1-uuid-here'::uuid,
--   'user2-uuid-here'::uuid
-- );

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('chat_threads', 'chat_messages')
ORDER BY tablename, policyname;

-- If function doesn't exist, create it manually
CREATE OR REPLACE FUNCTION get_or_create_thread(user_a UUID, user_b UUID)
RETURNS UUID AS $$
DECLARE
  thread_id UUID;
  user1 UUID;
  user2 UUID;
BEGIN
  -- Ensure consistent ordering
  IF user_a < user_b THEN
    user1 := user_a;
    user2 := user_b;
  ELSE
    user1 := user_b;
    user2 := user_a;
  END IF;

  -- Try to find existing thread
  SELECT id INTO thread_id
  FROM chat_threads
  WHERE user1_id = user1 AND user2_id = user2;

  -- Create if doesn't exist
  IF thread_id IS NULL THEN
    INSERT INTO chat_threads (user1_id, user2_id)
    VALUES (user1, user2)
    RETURNING id INTO thread_id;
  END IF;

  RETURN thread_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_or_create_thread(UUID, UUID) TO authenticated;

-- Verify function was created
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'get_or_create_thread';

