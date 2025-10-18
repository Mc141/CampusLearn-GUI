-- answer_reply_attachments.sql
-- Add support for file attachments to answer replies

-- Create table for attachments to answer replies
CREATE TABLE IF NOT EXISTS answer_reply_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('pdf', 'video', 'audio', 'image', 'link', 'document')),
    url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    reply_id UUID NOT NULL REFERENCES answer_replies(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    size INTEGER DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    tags JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_answer_reply_attachments_reply_id ON answer_reply_attachments(reply_id);
CREATE INDEX IF NOT EXISTS idx_answer_reply_attachments_uploaded_by ON answer_reply_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_answer_reply_attachments_type ON answer_reply_attachments(type);
CREATE INDEX IF NOT EXISTS idx_answer_reply_attachments_created_at ON answer_reply_attachments(created_at);
CREATE INDEX IF NOT EXISTS idx_answer_reply_attachments_is_active ON answer_reply_attachments(is_active);

-- Add trigger for updated_at timestamps
DROP TRIGGER IF EXISTS update_answer_reply_attachments_updated_at ON answer_reply_attachments;
CREATE TRIGGER update_answer_reply_attachments_updated_at 
    BEFORE UPDATE ON answer_reply_attachments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE answer_reply_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies (no strict policies as requested)
DROP POLICY IF EXISTS "Allow all authenticated users to select answer reply attachments" ON answer_reply_attachments;
CREATE POLICY "Allow all authenticated users to select answer reply attachments" ON answer_reply_attachments
FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "Allow all authenticated users to insert answer reply attachments" ON answer_reply_attachments;
CREATE POLICY "Allow all authenticated users to insert answer reply attachments" ON answer_reply_attachments
FOR INSERT TO authenticated WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Allow all authenticated users to update answer reply attachments" ON answer_reply_attachments;
CREATE POLICY "Allow all authenticated users to update answer reply attachments" ON answer_reply_attachments
FOR UPDATE TO authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Allow all authenticated users to delete answer reply attachments" ON answer_reply_attachments;
CREATE POLICY "Allow all authenticated users to delete answer reply attachments" ON answer_reply_attachments
FOR DELETE TO authenticated USING (TRUE);

-- Add comments for documentation
COMMENT ON TABLE answer_reply_attachments IS 'File attachments for replies to tutor answers';
COMMENT ON COLUMN answer_reply_attachments.reply_id IS 'The answer reply this attachment belongs to';
COMMENT ON COLUMN answer_reply_attachments.title IS 'Display title for the attachment';
COMMENT ON COLUMN answer_reply_attachments.description IS 'Optional description of the attachment';
COMMENT ON COLUMN answer_reply_attachments.type IS 'Type of attachment (pdf, video, audio, image, link, document)';
COMMENT ON COLUMN answer_reply_attachments.url IS 'Public URL to access the attachment';
COMMENT ON COLUMN answer_reply_attachments.file_name IS 'Original filename of the uploaded file';
COMMENT ON COLUMN answer_reply_attachments.file_path IS 'Path to the file in storage';
COMMENT ON COLUMN answer_reply_attachments.uploaded_by IS 'User who uploaded this attachment';
COMMENT ON COLUMN answer_reply_attachments.size IS 'File size in bytes';
COMMENT ON COLUMN answer_reply_attachments.downloads IS 'Number of times this attachment has been downloaded';
COMMENT ON COLUMN answer_reply_attachments.tags IS 'JSON object containing tags for the attachment';
COMMENT ON COLUMN answer_reply_attachments.is_active IS 'Whether the attachment is active/visible';
