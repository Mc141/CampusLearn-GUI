-- Remove all RLS policies and disable RLS on chatbot tables
-- This completely removes security restrictions

-- Disable RLS on all chatbot tables
ALTER TABLE chatbot_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_escalations DISABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_notifications DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies (this will remove any policies that exist)
DROP POLICY IF EXISTS "Anyone can read active chatbot conversations" ON chatbot_conversations;
DROP POLICY IF EXISTS "Users can manage their own chatbot conversations" ON chatbot_conversations;
DROP POLICY IF EXISTS "Allow all authenticated users full access to chatbot_conversations" ON chatbot_conversations;
DROP POLICY IF EXISTS "Allow anonymous access to chatbot_conversations" ON chatbot_conversations;

DROP POLICY IF EXISTS "Anyone can read chatbot messages" ON chatbot_messages;
DROP POLICY IF EXISTS "Users can manage their own chatbot messages" ON chatbot_messages;
DROP POLICY IF EXISTS "Allow all authenticated users full access to chatbot_messages" ON chatbot_messages;
DROP POLICY IF EXISTS "Allow anonymous access to chatbot_messages" ON chatbot_messages;

DROP POLICY IF EXISTS "Anyone can read chatbot escalations" ON chatbot_escalations;
DROP POLICY IF EXISTS "Users can manage their own chatbot escalations" ON chatbot_escalations;
DROP POLICY IF EXISTS "Allow all authenticated users full access to chatbot_escalations" ON chatbot_escalations;
DROP POLICY IF EXISTS "Allow anonymous access to chatbot_escalations" ON chatbot_escalations;

DROP POLICY IF EXISTS "Anyone can read tutor notifications" ON tutor_notifications;
DROP POLICY IF EXISTS "Tutors can manage their own notifications" ON tutor_notifications;
DROP POLICY IF EXISTS "Allow all authenticated users full access to tutor_notifications" ON tutor_notifications;
DROP POLICY IF EXISTS "Allow anonymous access to tutor_notifications" ON tutor_notifications;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('chatbot_conversations', 'chatbot_messages', 'chatbot_escalations', 'tutor_notifications');
