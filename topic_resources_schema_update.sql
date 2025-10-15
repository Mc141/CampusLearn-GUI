-- ==============================================
-- TOPIC RESOURCES DATABASE UPDATES
-- ==============================================

-- Add topic_id column to resources table to link resources to specific topics
ALTER TABLE resources ADD COLUMN topic_id UUID REFERENCES topics(id) ON DELETE CASCADE;

-- Add file_name column to store original file name
ALTER TABLE resources ADD COLUMN file_name VARCHAR(255);

-- Add file_path column to store the storage path
ALTER TABLE resources ADD COLUMN file_path TEXT;

-- Update the type constraint to include more file types
ALTER TABLE resources DROP CONSTRAINT IF EXISTS resources_type_check;
ALTER TABLE resources ADD CONSTRAINT resources_type_check 
    CHECK (type IN ('pdf', 'video', 'audio', 'image', 'link', 'document', 'presentation', 'spreadsheet', 'text'));

-- Add index for topic-based queries
CREATE INDEX IF NOT EXISTS idx_resources_topic_id ON resources(topic_id);

-- Add index for uploaded_by queries
CREATE INDEX IF NOT EXISTS idx_resources_uploaded_by ON resources(uploaded_by);

-- Add comment for documentation
COMMENT ON COLUMN resources.topic_id IS 'Links resource to a specific topic (optional)';
COMMENT ON COLUMN resources.file_name IS 'Original name of the uploaded file';
COMMENT ON COLUMN resources.file_path IS 'Storage path in Supabase Storage bucket';

-- ==============================================
-- EXAMPLE DATA (Optional - for testing)
-- ==============================================

-- You can add some sample resources linked to topics if needed
-- INSERT INTO resources (title, description, type, url, topic_id, uploaded_by, file_name, file_path, size)
-- VALUES 
--     ('Sample PDF', 'Example resource for testing', 'pdf', 'https://example.com/sample.pdf', 
--      (SELECT id FROM topics LIMIT 1), (SELECT id FROM users WHERE role = 'tutor' LIMIT 1), 
--      'sample.pdf', 'topic-resources/sample.pdf', 1024000);
