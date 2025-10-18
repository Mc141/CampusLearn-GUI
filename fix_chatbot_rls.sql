-- Fix RLS policies for chatbot tables
-- This script removes restrictive policies and allows all authenticated users full access

-- Disable RLS temporarily to fix policies
ALTER TABLE chatbot_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_escalations DISABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_notifications DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read active chatbot conversations" ON chatbot_conversations;
DROP POLICY IF EXISTS "Users can manage their own chatbot conversations" ON chatbot_conversations;
DROP POLICY IF EXISTS "Anyone can read chatbot messages" ON chatbot_messages;
DROP POLICY IF EXISTS "Users can manage their own chatbot messages" ON chatbot_messages;
DROP POLICY IF EXISTS "Anyone can read chatbot escalations" ON chatbot_escalations;
DROP POLICY IF EXISTS "Users can manage their own chatbot escalations" ON chatbot_escalations;
DROP POLICY IF EXISTS "Anyone can read tutor notifications" ON tutor_notifications;
DROP POLICY IF EXISTS "Tutors can manage their own notifications" ON tutor_notifications;

-- Re-enable RLS
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_notifications ENABLE ROW LEVEL SECURITY;

-- Create simple policies that allow all authenticated users full access
CREATE POLICY "Allow all authenticated users full access to chatbot_conversations" ON chatbot_conversations
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all authenticated users full access to chatbot_messages" ON chatbot_messages
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all authenticated users full access to chatbot_escalations" ON chatbot_escalations
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all authenticated users full access to tutor_notifications" ON tutor_notifications
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Also allow anonymous access for testing (remove this in production)
CREATE POLICY "Allow anonymous access to chatbot_conversations" ON chatbot_conversations
    FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous access to chatbot_messages" ON chatbot_messages
    FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous access to chatbot_escalations" ON chatbot_escalations
    FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous access to tutor_notifications" ON tutor_notifications
    FOR ALL TO anon USING (true) WITH CHECK (true);
