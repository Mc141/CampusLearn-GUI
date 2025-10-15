-- forum_attachments_table.sql
-- Create table for forum post attachments with no security restrictions

CREATE TABLE IF NOT EXISTS forum_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('pdf', 'video', 'audio', 'image', 'link', 'document', 'presentation', 'spreadsheet', 'text')),
    url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
    reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    size BIGINT,
    downloads INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure either post_id or reply_id is set, but not both
    CONSTRAINT check_post_or_reply CHECK (
        (post_id IS NOT NULL AND reply_id IS NULL) OR 
        (post_id IS NULL AND reply_id IS NOT NULL)
    )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_forum_attachments_post_id ON forum_attachments(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_attachments_reply_id ON forum_attachments(reply_id);
CREATE INDEX IF NOT EXISTS idx_forum_attachments_uploaded_by ON forum_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_forum_attachments_type ON forum_attachments(type);
CREATE INDEX IF NOT EXISTS idx_forum_attachments_is_active ON forum_attachments(is_active);

-- Add triggers for updated_at timestamps
DROP TRIGGER IF EXISTS update_forum_attachments_updated_at ON forum_attachments;
CREATE TRIGGER update_forum_attachments_updated_at
    BEFORE UPDATE ON forum_attachments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Disable Row Level Security (no restrictions)
ALTER TABLE forum_attachments DISABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON TABLE forum_attachments IS 'File attachments for forum posts and replies (no security restrictions)';
COMMENT ON COLUMN forum_attachments.file_name IS 'Original name of the uploaded file';
COMMENT ON COLUMN forum_attachments.file_path IS 'Path to the file in Supabase Storage';
COMMENT ON COLUMN forum_attachments.post_id IS 'The forum post this attachment belongs to (if attached to post)';
COMMENT ON COLUMN forum_attachments.reply_id IS 'The forum reply this attachment belongs to (if attached to reply)';
COMMENT ON COLUMN forum_attachments.uploaded_by IS 'The user who uploaded this attachment';
COMMENT ON COLUMN forum_attachments.size IS 'Size of the file in bytes';
COMMENT ON COLUMN forum_attachments.downloads IS 'Number of times the attachment has been downloaded';
COMMENT ON COLUMN forum_attachments.is_active IS 'Whether the attachment is active (not soft-deleted)';
