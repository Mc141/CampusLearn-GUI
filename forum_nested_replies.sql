-- forum_nested_replies.sql
-- Add support for nested replies (Reddit-style) to forum_replies table

-- Add parent_reply_id column to support nested replies
ALTER TABLE forum_replies 
ADD COLUMN IF NOT EXISTS parent_reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE;

-- Add depth column to track nesting level (0 = direct reply to post, 1 = reply to reply, etc.)
ALTER TABLE forum_replies 
ADD COLUMN IF NOT EXISTS depth INTEGER DEFAULT 0 CHECK (depth >= 0 AND depth <= 5);

-- Add thread_path column to store the full path of the reply thread (for efficient querying)
-- Format: "post_id:parent1:parent2:parent3" (e.g., "abc123:def456:ghi789")
ALTER TABLE forum_replies 
ADD COLUMN IF NOT EXISTS thread_path TEXT;

-- Add indexes for better performance with nested queries
CREATE INDEX IF NOT EXISTS idx_forum_replies_parent_reply_id ON forum_replies(parent_reply_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_depth ON forum_replies(depth);
CREATE INDEX IF NOT EXISTS idx_forum_replies_thread_path ON forum_replies(thread_path);

-- Add constraint to ensure thread_path is properly formatted
ALTER TABLE forum_replies 
ADD CONSTRAINT check_thread_path_format CHECK (
    thread_path IS NULL OR 
    thread_path ~ '^[a-f0-9-]+(:[a-f0-9-]+)*$'
);

-- Add constraint to ensure depth matches thread_path depth
ALTER TABLE forum_replies 
ADD CONSTRAINT check_depth_matches_thread_path CHECK (
    thread_path IS NULL OR 
    depth = (array_length(string_to_array(thread_path, ':'), 1) - 1)
);

-- Update comments
COMMENT ON COLUMN forum_replies.parent_reply_id IS 'The parent reply this reply is responding to (NULL for direct post replies)';
COMMENT ON COLUMN forum_replies.depth IS 'Nesting depth (0 = direct reply to post, 1 = reply to reply, max 5)';
COMMENT ON COLUMN forum_replies.thread_path IS 'Full path of the reply thread for efficient querying';

-- Create a function to automatically set thread_path when inserting/updating replies
CREATE OR REPLACE FUNCTION set_forum_reply_thread_path()
RETURNS TRIGGER AS $$
DECLARE
    parent_thread_path TEXT;
    post_uuid TEXT;
BEGIN
    -- Get the post_id (either directly or from parent)
    IF NEW.parent_reply_id IS NULL THEN
        -- Direct reply to post
        post_uuid := NEW.post_id::TEXT;
        NEW.thread_path := post_uuid;
        NEW.depth := 0;
    ELSE
        -- Reply to another reply
        SELECT thread_path INTO parent_thread_path 
        FROM forum_replies 
        WHERE id = NEW.parent_reply_id;
        
        IF parent_thread_path IS NULL THEN
            RAISE EXCEPTION 'Parent reply not found or has no thread_path';
        END IF;
        
        NEW.thread_path := parent_thread_path || ':' || NEW.parent_reply_id::TEXT;
        NEW.depth := (SELECT depth + 1 FROM forum_replies WHERE id = NEW.parent_reply_id);
        
        -- Ensure depth doesn't exceed maximum
        IF NEW.depth > 5 THEN
            RAISE EXCEPTION 'Maximum reply depth (5) exceeded';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set thread_path and depth
DROP TRIGGER IF EXISTS set_forum_reply_thread_path_trigger ON forum_replies;
CREATE TRIGGER set_forum_reply_thread_path_trigger
    BEFORE INSERT OR UPDATE ON forum_replies
    FOR EACH ROW EXECUTE FUNCTION set_forum_reply_thread_path();

-- Update existing replies to have proper thread_path and depth
UPDATE forum_replies 
SET thread_path = post_id::TEXT, depth = 0 
WHERE parent_reply_id IS NULL AND thread_path IS NULL;

-- Update the table comment
COMMENT ON TABLE forum_replies IS 'Replies to forum posts with support for nested replies (Reddit-style)';

