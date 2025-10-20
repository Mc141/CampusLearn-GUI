-- Add moderation support to questions, answers, and answer_replies tables
-- This script adds is_moderated fields to enable comprehensive moderation

-- Add is_moderated column to questions table
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS is_moderated BOOLEAN DEFAULT false;

-- Add is_moderated column to answers table
ALTER TABLE public.answers 
ADD COLUMN IF NOT EXISTS is_moderated BOOLEAN DEFAULT false;

-- Add is_moderated column to answer_replies table
ALTER TABLE public.answer_replies 
ADD COLUMN IF NOT EXISTS is_moderated BOOLEAN DEFAULT false;

-- Create indexes for better performance on moderation queries
CREATE INDEX IF NOT EXISTS idx_questions_is_moderated ON public.questions(is_moderated);
CREATE INDEX IF NOT EXISTS idx_answers_is_moderated ON public.answers(is_moderated);
CREATE INDEX IF NOT EXISTS idx_answer_replies_is_moderated ON public.answer_replies(is_moderated);

-- Update the question_details view to include is_moderated field
DROP VIEW IF EXISTS public.question_details;

CREATE VIEW public.question_details AS
SELECT 
    q.id,
    q.topic_id,
    q.student_id,
    q.title,
    q.content,
    q.is_anonymous,
    q.status,
    q.upvotes,
    q.tags,
    q.is_moderated,
    q.created_at,
    q.updated_at,
    t.title as topic_title,
    t.module_code,
    CONCAT(u.first_name, ' ', u.last_name) as student_name,
    COUNT(DISTINCT a.id) as answer_count
FROM questions q
LEFT JOIN topics t ON q.topic_id = t.id
LEFT JOIN users u ON q.student_id = u.id
LEFT JOIN answers a ON q.id = a.question_id
GROUP BY q.id, q.topic_id, q.student_id, q.title, q.content, q.is_anonymous, q.status, q.upvotes, q.tags, q.is_moderated, q.created_at, q.updated_at, t.title, t.module_code, u.first_name, u.last_name;

-- Grant full access to all roles
GRANT ALL ON public.question_details TO authenticated, anon;
GRANT ALL ON public.questions TO authenticated, anon;
GRANT ALL ON public.answers TO authenticated, anon;
GRANT ALL ON public.answer_replies TO authenticated, anon;

-- Disable Row Level Security on all tables
ALTER TABLE public.questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_replies DISABLE ROW LEVEL SECURITY;

-- Remove all existing policies
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public' 
        AND tablename IN ('questions', 'answers', 'answer_replies')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END
$$;
