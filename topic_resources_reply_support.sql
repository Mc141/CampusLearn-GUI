-- topic_resources_reply_support.sql
-- Add support for reply-level attachments to topic_resources table

-- First, make topic_id nullable to support answer-only attachments
ALTER TABLE topic_resources 
ALTER COLUMN topic_id DROP NOT NULL;

-- Add answer_id column to support attachments for specific answers/replies
ALTER TABLE topic_resources 
ADD COLUMN IF NOT EXISTS answer_id UUID REFERENCES answers(id) ON DELETE CASCADE;

-- Update the constraint to allow either topic_id OR answer_id (but not both)
ALTER TABLE topic_resources 
DROP CONSTRAINT IF EXISTS check_topic_or_answer;

ALTER TABLE topic_resources 
ADD CONSTRAINT check_topic_or_answer CHECK (
    (topic_id IS NOT NULL AND answer_id IS NULL) OR 
    (topic_id IS NULL AND answer_id IS NOT NULL)
);

-- Add index for answer_id
CREATE INDEX IF NOT EXISTS idx_topic_resources_answer_id ON topic_resources(answer_id);

-- Update comments
COMMENT ON COLUMN topic_resources.answer_id IS 'The answer/reply this resource belongs to (if attached to a specific answer)';
COMMENT ON COLUMN topic_resources.topic_id IS 'The topic this resource belongs to (if attached to topic level)';

-- Update the table comment
COMMENT ON TABLE topic_resources IS 'Learning resources for topics and topic replies/answers';
