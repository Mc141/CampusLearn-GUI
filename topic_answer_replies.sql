-- topic_answer_replies.sql
-- Add support for replies to topic answers

-- Create table for replies to answers
CREATE TABLE IF NOT EXISTS answer_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    answer_id UUID NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_anonymous BOOLEAN DEFAULT false,
    upvotes INTEGER DEFAULT 0,
    is_moderated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_answer_replies_answer_id ON answer_replies(answer_id);
CREATE INDEX IF NOT EXISTS idx_answer_replies_author_id ON answer_replies(author_id);
CREATE INDEX IF NOT EXISTS idx_answer_replies_created_at ON answer_replies(created_at);
CREATE INDEX IF NOT EXISTS idx_answer_replies_is_moderated ON answer_replies(is_moderated);

-- Add trigger for updated_at timestamps
DROP TRIGGER IF EXISTS update_answer_replies_updated_at ON answer_replies;
CREATE TRIGGER update_answer_replies_updated_at 
    BEFORE UPDATE ON answer_replies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE answer_replies ENABLE ROW LEVEL SECURITY;

-- RLS Policies (no strict policies as requested)
DROP POLICY IF EXISTS "Allow all authenticated users to select answer replies" ON answer_replies;
CREATE POLICY "Allow all authenticated users to select answer replies" ON answer_replies
FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Allow all authenticated users to insert answer replies" ON answer_replies;
CREATE POLICY "Allow all authenticated users to insert answer replies" ON answer_replies
FOR INSERT TO authenticated WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Allow all authenticated users to update answer replies" ON answer_replies;
CREATE POLICY "Allow all authenticated users to update answer replies" ON answer_replies
FOR UPDATE TO authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Allow all authenticated users to delete answer replies" ON answer_replies;
CREATE POLICY "Allow all authenticated users to delete answer replies" ON answer_replies
FOR DELETE TO authenticated USING (TRUE);

-- Add comments for documentation
COMMENT ON TABLE answer_replies IS 'Replies to tutor answers in topics (follow-up questions, clarifications, etc.)';
COMMENT ON COLUMN answer_replies.answer_id IS 'The answer this reply is responding to';
COMMENT ON COLUMN answer_replies.content IS 'The content of the reply';
COMMENT ON COLUMN answer_replies.author_id IS 'The user who wrote this reply';
COMMENT ON COLUMN answer_replies.is_anonymous IS 'Whether the reply author is anonymous';
COMMENT ON COLUMN answer_replies.upvotes IS 'Number of upvotes this reply has received';
COMMENT ON COLUMN answer_replies.is_moderated IS 'Whether the reply has been moderated/hidden';
