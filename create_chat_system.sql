-- ============================================
-- CHAT SYSTEM DATABASE SCHEMA
-- Enable real-time messaging between users
-- ============================================

-- Create chat_threads table (conversations between two users)
CREATE TABLE IF NOT EXISTS chat_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique thread per user pair
  CONSTRAINT unique_user_pair UNIQUE (user1_id, user2_id),
  CONSTRAINT user_pair_order CHECK (user1_id < user2_id)
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Validation
  CONSTRAINT message_not_empty CHECK (LENGTH(TRIM(content)) > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_threads_user1 ON chat_threads(user1_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_user2 ON chat_threads(user2_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_last_message ON chat_threads(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread ON chat_messages(thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread ON chat_messages(is_read) WHERE is_read = FALSE;

-- Enable Row Level Security
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own threads" ON chat_threads;
DROP POLICY IF EXISTS "Users can create threads" ON chat_threads;
DROP POLICY IF EXISTS "Users can view messages in their threads" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can update their messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can mark messages as read" ON chat_messages;

-- RLS Policies for chat_threads
CREATE POLICY "Users can view their own threads"
ON chat_threads FOR SELECT
TO authenticated
USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can create threads"
ON chat_threads FOR INSERT
TO authenticated
WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can update their threads"
ON chat_threads FOR UPDATE
TO authenticated
USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages in their threads"
ON chat_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM chat_threads
    WHERE chat_threads.id = chat_messages.thread_id
    AND (chat_threads.user1_id = auth.uid() OR chat_threads.user2_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages"
ON chat_messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM chat_threads
    WHERE chat_threads.id = thread_id
    AND (chat_threads.user1_id = auth.uid() OR chat_threads.user2_id = auth.uid())
  )
);

CREATE POLICY "Users can update their own messages"
ON chat_messages FOR UPDATE
TO authenticated
USING (sender_id = auth.uid());

-- Function to update last_message_at on chat_threads
CREATE OR REPLACE FUNCTION update_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_threads
  SET last_message_at = NEW.created_at
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_message_at
DROP TRIGGER IF EXISTS trigger_update_thread_last_message ON chat_messages;
CREATE TRIGGER trigger_update_thread_last_message
AFTER INSERT ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_thread_last_message();

-- Function to get or create thread between two users
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

-- Enable realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Comments for documentation
COMMENT ON TABLE chat_threads IS 'Conversation threads between two users';
COMMENT ON TABLE chat_messages IS 'Individual messages within threads';
COMMENT ON COLUMN chat_threads.user1_id IS 'First user (lower UUID)';
COMMENT ON COLUMN chat_threads.user2_id IS 'Second user (higher UUID)';
COMMENT ON COLUMN chat_messages.is_read IS 'Whether the recipient has read this message';

-- Verification queries
SELECT 'Chat tables created successfully!' AS status;

SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.table_constraints 
        WHERE constraint_type = 'CHECK' 
        AND table_name = t.table_name) AS check_constraints,
       (SELECT COUNT(*) FROM pg_indexes 
        WHERE tablename = t.table_name) AS indexes
FROM information_schema.tables t
WHERE table_name IN ('chat_threads', 'chat_messages')
  AND table_schema = 'public';

