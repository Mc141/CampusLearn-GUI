-- ==============================================
-- TOPIC RESOURCES - SAFE UPDATE (Only add missing parts)
-- ==============================================

-- Check if table exists and add missing columns if needed
DO $$ 
BEGIN
    -- Add file_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'topic_resources' AND column_name = 'file_name') THEN
        ALTER TABLE topic_resources ADD COLUMN file_name VARCHAR(255);
    END IF;
    
    -- Add file_path column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'topic_resources' AND column_name = 'file_path') THEN
        ALTER TABLE topic_resources ADD COLUMN file_path TEXT;
    END IF;
    
    -- Add size column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'topic_resources' AND column_name = 'size') THEN
        ALTER TABLE topic_resources ADD COLUMN size BIGINT;
    END IF;
    
    -- Add downloads column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'topic_resources' AND column_name = 'downloads') THEN
        ALTER TABLE topic_resources ADD COLUMN downloads INTEGER DEFAULT 0;
    END IF;
    
    -- Add tags column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'topic_resources' AND column_name = 'tags') THEN
        ALTER TABLE topic_resources ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;
    
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'topic_resources' AND column_name = 'is_active') THEN
        ALTER TABLE topic_resources ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'topic_resources' AND column_name = 'updated_at') THEN
        ALTER TABLE topic_resources ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Update type constraint if needed
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.check_constraints 
               WHERE constraint_name = 'topic_resources_type_check') THEN
        ALTER TABLE topic_resources DROP CONSTRAINT topic_resources_type_check;
    END IF;
    
    -- Add new constraint
    ALTER TABLE topic_resources ADD CONSTRAINT topic_resources_type_check 
        CHECK (type IN ('pdf', 'video', 'audio', 'image', 'document', 'presentation', 'spreadsheet', 'text'));
END $$;

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_topic_resources_topic_id ON topic_resources(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_resources_uploaded_by ON topic_resources(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_topic_resources_type ON topic_resources(type);
CREATE INDEX IF NOT EXISTS idx_topic_resources_created_at ON topic_resources(created_at);

-- Add trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_topic_resources_updated_at') THEN
        CREATE TRIGGER update_topic_resources_updated_at 
            BEFORE UPDATE ON topic_resources 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE topic_resources ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Anyone can read active topic resources" ON topic_resources;
DROP POLICY IF EXISTS "Authenticated users can upload topic resources" ON topic_resources;
DROP POLICY IF EXISTS "Users can update their own topic resources" ON topic_resources;
DROP POLICY IF EXISTS "Users can delete their own topic resources" ON topic_resources;
DROP POLICY IF EXISTS "Admins can manage all topic resources" ON topic_resources;

-- Create new policies
CREATE POLICY "Anyone can read active topic resources" ON topic_resources
    FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can upload topic resources" ON topic_resources
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own topic resources" ON topic_resources
    FOR UPDATE USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their own topic resources" ON topic_resources
    FOR DELETE USING (auth.uid() = uploaded_by);

CREATE POLICY "Admins can manage all topic resources" ON topic_resources
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Add comments for documentation
COMMENT ON TABLE topic_resources IS 'Learning resources uploaded for specific topics';
COMMENT ON COLUMN topic_resources.topic_id IS 'The topic this resource belongs to';
COMMENT ON COLUMN topic_resources.file_name IS 'Original name of the uploaded file';
COMMENT ON COLUMN topic_resources.file_path IS 'Storage path in Supabase Storage bucket';
COMMENT ON COLUMN topic_resources.type IS 'Type of resource (pdf, video, audio, image, document, presentation, spreadsheet, text)';
COMMENT ON COLUMN topic_resources.downloads IS 'Number of times this resource has been downloaded';
