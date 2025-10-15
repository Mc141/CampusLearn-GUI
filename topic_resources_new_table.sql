-- ==============================================
-- TOPIC RESOURCES - NEW TABLE APPROACH
-- ==============================================

-- Create a new dedicated table for topic resources
CREATE TABLE IF NOT EXISTS topic_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('pdf', 'video', 'audio', 'image', 'document', 'presentation', 'spreadsheet', 'text')),
    url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    size BIGINT,
    downloads INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_topic_resources_topic_id ON topic_resources(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_resources_uploaded_by ON topic_resources(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_topic_resources_type ON topic_resources(type);
CREATE INDEX IF NOT EXISTS idx_topic_resources_created_at ON topic_resources(created_at);

-- Add triggers for updated_at timestamps
DROP TRIGGER IF EXISTS update_topic_resources_updated_at ON topic_resources;
CREATE TRIGGER update_topic_resources_updated_at 
    BEFORE UPDATE ON topic_resources 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE topic_resources IS 'Learning resources uploaded for specific topics';
COMMENT ON COLUMN topic_resources.topic_id IS 'The topic this resource belongs to';
COMMENT ON COLUMN topic_resources.file_name IS 'Original name of the uploaded file';
COMMENT ON COLUMN topic_resources.file_path IS 'Storage path in Supabase Storage bucket';
COMMENT ON COLUMN topic_resources.type IS 'Type of resource (pdf, video, audio, image, document, presentation, spreadsheet, text)';
COMMENT ON COLUMN topic_resources.downloads IS 'Number of times this resource has been downloaded';

-- ==============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================

-- Enable RLS on the table
ALTER TABLE topic_resources ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active topic resources
CREATE POLICY "Anyone can read active topic resources" ON topic_resources
    FOR SELECT USING (is_active = true);

-- Policy: Authenticated users can upload resources to topics
CREATE POLICY "Authenticated users can upload topic resources" ON topic_resources
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can update their own resources
CREATE POLICY "Users can update their own topic resources" ON topic_resources
    FOR UPDATE USING (auth.uid() = uploaded_by);

-- Policy: Users can delete their own resources
CREATE POLICY "Users can delete their own topic resources" ON topic_resources
    FOR DELETE USING (auth.uid() = uploaded_by);

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage all topic resources" ON topic_resources
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );
