-- Chatbot Conversations Table
CREATE TABLE IF NOT EXISTS chatbot_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT,
    message_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    context_limit_reached BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chatbot Messages Table
CREATE TABLE IF NOT EXISTS chatbot_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_from_bot BOOLEAN NOT NULL,
    escalated_to_tutor BOOLEAN DEFAULT false,
    tutor_module TEXT,
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user_id ON chatbot_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_active ON chatbot_conversations(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_conversation_id ON chatbot_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_created_at ON chatbot_messages(created_at);

-- Update trigger for conversations
CREATE OR REPLACE FUNCTION update_chatbot_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_chatbot_conversations_updated_at ON chatbot_conversations;
CREATE TRIGGER update_chatbot_conversations_updated_at
    BEFORE UPDATE ON chatbot_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_chatbot_conversation_updated_at();

-- RLS Policies (no restrictions for now as requested)
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read chatbot conversations" ON chatbot_conversations;
DROP POLICY IF EXISTS "Anyone can insert chatbot conversations" ON chatbot_conversations;
DROP POLICY IF EXISTS "Anyone can update chatbot conversations" ON chatbot_conversations;
DROP POLICY IF EXISTS "Anyone can delete chatbot conversations" ON chatbot_conversations;

DROP POLICY IF EXISTS "Anyone can read chatbot messages" ON chatbot_messages;
DROP POLICY IF EXISTS "Anyone can insert chatbot messages" ON chatbot_messages;
DROP POLICY IF EXISTS "Anyone can update chatbot messages" ON chatbot_messages;
DROP POLICY IF EXISTS "Anyone can delete chatbot messages" ON chatbot_messages;

-- Create policies allowing all authenticated users full access
CREATE POLICY "Anyone can read chatbot conversations" ON chatbot_conversations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can insert chatbot conversations" ON chatbot_conversations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Anyone can update chatbot conversations" ON chatbot_conversations
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can delete chatbot conversations" ON chatbot_conversations
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can read chatbot messages" ON chatbot_messages
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can insert chatbot messages" ON chatbot_messages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Anyone can update chatbot messages" ON chatbot_messages
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can delete chatbot messages" ON chatbot_messages
    FOR DELETE USING (auth.role() = 'authenticated');

-- Comments
COMMENT ON TABLE chatbot_conversations IS 'Stores chatbot conversation sessions for users';
COMMENT ON COLUMN chatbot_conversations.title IS 'Optional title for the conversation';
COMMENT ON COLUMN chatbot_conversations.message_count IS 'Number of messages in this conversation';
COMMENT ON COLUMN chatbot_conversations.is_active IS 'Whether this conversation is currently active';
COMMENT ON COLUMN chatbot_conversations.context_limit_reached IS 'Whether this conversation has reached the context limit';

COMMENT ON TABLE chatbot_messages IS 'Individual messages within chatbot conversations';
COMMENT ON COLUMN chatbot_messages.is_from_bot IS 'Whether this message is from the bot or user';
COMMENT ON COLUMN chatbot_messages.escalated_to_tutor IS 'Whether this message was escalated to a human tutor';
COMMENT ON COLUMN chatbot_messages.tutor_module IS 'Module for which the message was escalated';
COMMENT ON COLUMN chatbot_messages.confidence_score IS 'Bot confidence score for this response (0.00-1.00)';
