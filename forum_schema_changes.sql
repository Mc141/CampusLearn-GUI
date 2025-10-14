-- ==============================================
-- FORUM FUNCTIONALITY DATABASE CHANGES
-- ==============================================

-- Add the increment_upvotes function (if it doesn't exist)
CREATE OR REPLACE FUNCTION increment_upvotes(table_name TEXT, row_id UUID)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('UPDATE %I SET upvotes = upvotes + 1 WHERE id = $1', table_name) USING row_id;
END;
$$ LANGUAGE plpgsql;

-- Ensure forum_posts table exists with correct structure
CREATE TABLE IF NOT EXISTS forum_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_anonymous BOOLEAN DEFAULT false,
    upvotes INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    is_moderated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure forum_replies table exists with correct structure
CREATE TABLE IF NOT EXISTS forum_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_anonymous BOOLEAN DEFAULT false,
    upvotes INTEGER DEFAULT 0,
    is_moderated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_forum_posts_upvotes ON forum_posts(upvotes);
CREATE INDEX IF NOT EXISTS idx_forum_posts_is_moderated ON forum_posts(is_moderated);
CREATE INDEX IF NOT EXISTS idx_forum_replies_post_id ON forum_replies(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_created_at ON forum_replies(created_at);
CREATE INDEX IF NOT EXISTS idx_forum_replies_is_moderated ON forum_replies(is_moderated);

-- Add triggers for updated_at timestamps (drop first if they exist)
DROP TRIGGER IF EXISTS update_forum_posts_updated_at ON forum_posts;
CREATE TRIGGER update_forum_posts_updated_at 
    BEFORE UPDATE ON forum_posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_forum_replies_updated_at ON forum_replies;
CREATE TRIGGER update_forum_replies_updated_at 
    BEFORE UPDATE ON forum_replies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE forum_posts IS 'Public forum posts (anonymous allowed)';
COMMENT ON TABLE forum_replies IS 'Replies to forum posts (anonymous allowed)';
COMMENT ON COLUMN forum_posts.is_anonymous IS 'Whether the post author is anonymous';
COMMENT ON COLUMN forum_posts.tags IS 'Array of tags for categorization';
COMMENT ON COLUMN forum_posts.is_moderated IS 'Whether the post has been moderated/hidden';
COMMENT ON COLUMN forum_replies.is_anonymous IS 'Whether the reply author is anonymous';
COMMENT ON COLUMN forum_replies.is_moderated IS 'Whether the reply has been moderated/hidden';
