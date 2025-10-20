-- Add moderation support to topics table
-- This script adds the is_moderated field to enable topic moderation

-- Add is_moderated column to topics table
ALTER TABLE public.topics 
ADD COLUMN IF NOT EXISTS is_moderated BOOLEAN DEFAULT false;

-- Create index for better performance on moderation queries
CREATE INDEX IF NOT EXISTS idx_topics_is_moderated ON public.topics(is_moderated);

-- Update the topic_details view to include is_moderated field
DROP VIEW IF EXISTS public.topic_details;

CREATE VIEW public.topic_details AS
SELECT 
    t.id,
    t.title,
    t.description,
    t.module_code,
    t.created_by,
    t.is_active,
    t.is_moderated,
    t.created_at,
    t.updated_at,
    COUNT(DISTINCT ts.user_id) as subscriber_count,
    COUNT(DISTINCT tt.tutor_id) as tutor_count,
    u.first_name as creator_first_name,
    u.last_name as creator_last_name
FROM topics t
LEFT JOIN topic_subscriptions ts ON t.id = ts.topic_id
LEFT JOIN topic_tutors tt ON t.id = tt.topic_id
LEFT JOIN users u ON t.created_by = u.id
GROUP BY t.id, t.title, t.description, t.module_code, t.created_by, t.is_active, t.is_moderated, t.created_at, t.updated_at, u.first_name, u.last_name;

-- Drop existing functions to allow recreation with updated signatures
DROP FUNCTION IF EXISTS get_user_subscribed_topics(uuid);
DROP FUNCTION IF EXISTS get_user_managed_topics(uuid);
DROP FUNCTION IF EXISTS get_unanswered_questions_for_tutor(uuid);

-- Recreate functions to respect moderation status
-- Function to get user's subscribed topics (exclude moderated)
CREATE OR REPLACE FUNCTION get_user_subscribed_topics(user_uuid UUID)
RETURNS TABLE (
    topic_id UUID,
    title VARCHAR(255),
    description TEXT,
    module_code VARCHAR(20),
    subscribed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.title,
        t.description,
        t.module_code,
        ts.subscribed_at
    FROM topics t
    JOIN topic_subscriptions ts ON t.id = ts.topic_id
    WHERE ts.user_id = user_uuid 
        AND t.is_active = true 
        AND t.is_moderated = false
    ORDER BY ts.subscribed_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's managed topics (exclude moderated)
CREATE OR REPLACE FUNCTION get_user_managed_topics(user_uuid UUID)
RETURNS TABLE (
    topic_id UUID,
    title VARCHAR(255),
    description TEXT,
    module_code VARCHAR(20),
    assigned_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.title,
        t.description,
        t.module_code,
        tt.assigned_at
    FROM topics t
    JOIN topic_tutors tt ON t.id = tt.topic_id
    WHERE tt.tutor_id = user_uuid 
        AND t.is_active = true 
        AND t.is_moderated = false
    ORDER BY tt.assigned_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get unanswered questions for a tutor (exclude moderated topics)
CREATE OR REPLACE FUNCTION get_unanswered_questions_for_tutor(tutor_uuid UUID)
RETURNS TABLE (
    question_id UUID,
    title VARCHAR(255),
    content TEXT,
    topic_title VARCHAR(255),
    module_code VARCHAR(20),
    student_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id,
        q.title,
        q.content,
        t.title,
        t.module_code,
        CONCAT(u.first_name, ' ', u.last_name),
        q.created_at
    FROM questions q
    JOIN topics t ON q.topic_id = t.id
    JOIN topic_tutors tt ON t.id = tt.topic_id
    JOIN users u ON q.student_id = u.id
    WHERE tt.tutor_id = tutor_uuid 
        AND q.status = 'open'
        AND t.is_moderated = false
        AND NOT EXISTS (
            SELECT 1 FROM answers a WHERE a.question_id = q.id AND a.tutor_id = tutor_uuid
        )
    ORDER BY q.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant full access to all roles
GRANT ALL ON public.topic_details TO authenticated, anon;
GRANT ALL ON public.topics TO authenticated, anon;
GRANT ALL ON public.topic_subscriptions TO authenticated, anon;
GRANT ALL ON public.topic_tutors TO authenticated, anon;
GRANT ALL ON public.questions TO authenticated, anon;
GRANT ALL ON public.answers TO authenticated, anon;
GRANT ALL ON public.users TO authenticated, anon;
GRANT ALL ON public.modules TO authenticated, anon;

GRANT EXECUTE ON FUNCTION get_user_subscribed_topics(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_managed_topics(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_unanswered_questions_for_tutor(uuid) TO authenticated, anon;

-- Disable Row Level Security on all tables
ALTER TABLE public.topics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_tutors DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules DISABLE ROW LEVEL SECURITY;

-- Remove all existing policies
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public' 
        AND tablename IN ('topics', 'topic_subscriptions', 'topic_tutors', 'questions', 'answers', 'users', 'modules')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END
$$;
