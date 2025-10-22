-- CampusLearn Database Cleanup Script
-- This script will reset all tables to a clean state for testing
-- WARNING: This will delete ALL data from the database

-- Disable foreign key checks temporarily to avoid constraint issues
SET session_replication_role = replica;

-- Clear all data from tables in reverse dependency order
-- (child tables first, then parent tables)

-- Clear voting and interaction tables
TRUNCATE TABLE answer_votes CASCADE;
TRUNCATE TABLE question_votes CASCADE;
TRUNCATE TABLE forum_post_votes CASCADE;
TRUNCATE TABLE forum_reply_votes CASCADE;

-- Clear attachment relationships
TRUNCATE TABLE answer_attachments CASCADE;
TRUNCATE TABLE message_attachments CASCADE;
TRUNCATE TABLE answer_reply_attachments CASCADE;
TRUNCATE TABLE forum_attachments CASCADE;

-- Clear chatbot data
TRUNCATE TABLE chatbot_messages CASCADE;
TRUNCATE TABLE chatbot_escalations CASCADE;
TRUNCATE TABLE chatbot_conversations CASCADE;
TRUNCATE TABLE tutor_notifications CASCADE;

-- Clear FAQ interaction data (preserve questions)
TRUNCATE TABLE faq_feedbacks CASCADE;
-- Reset FAQ interaction counts but keep the questions
UPDATE faqs SET views = 0, helpful = 0, not_helpful = 0;

-- Clear forum data
TRUNCATE TABLE forum_replies CASCADE;
TRUNCATE TABLE forum_posts CASCADE;

-- Clear messaging data
TRUNCATE TABLE messages CASCADE;

-- Clear answer and question data
TRUNCATE TABLE answer_replies CASCADE;
TRUNCATE TABLE answers CASCADE;
TRUNCATE TABLE questions CASCADE;

-- Clear resource data
TRUNCATE TABLE topic_resources CASCADE;
TRUNCATE TABLE resources CASCADE;
TRUNCATE TABLE attachments CASCADE;

-- Clear quiz data
TRUNCATE TABLE topic_quizzes CASCADE;

-- Clear topic and subscription data
TRUNCATE TABLE topic_subscriptions CASCADE;
TRUNCATE TABLE topic_tutors CASCADE;
TRUNCATE TABLE topics CASCADE;

-- Clear tutor application data
TRUNCATE TABLE tutor_application_modules CASCADE;
TRUNCATE TABLE tutor_applications CASCADE;
TRUNCATE TABLE tutor_matching_requests CASCADE;

-- Clear user module assignments
TRUNCATE TABLE user_modules CASCADE;

-- Clear notification data
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE notification_templates CASCADE;

-- Clear programme-module relationships but preserve modules and programmes
TRUNCATE TABLE programme_modules CASCADE;
-- Note: Preserving modules and programmes tables - they contain official Belgium Campus data

-- Clear knowledge vectors (if using vector search)
TRUNCATE TABLE campuslearn_knowledge_vectors CASCADE;

-- Clear chat messages
TRUNCATE TABLE chat_messages CASCADE;

-- Clear users (this should be last as it's referenced by many tables)
TRUNCATE TABLE users CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Reset sequences for UUID generation (if using sequences)
-- Note: PostgreSQL uses gen_random_uuid() and uuid_generate_v4() which don't need reset

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database cleanup completed successfully!';
    RAISE NOTICE 'All tables have been cleared and are ready for fresh data.';
    RAISE NOTICE 'You can now register new users and test the application from scratch.';
END $$;
