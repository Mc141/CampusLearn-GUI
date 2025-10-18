-- Complete Message Cleanup Script
-- This script will delete ALL messages from ALL systems
-- WARNING: This will permanently delete ALL message data!

-- First, let's see what we're about to delete
SELECT 
  'messages' as table_name,
  COUNT(*) as count
FROM messages
UNION ALL
SELECT 
  'attachments' as table_name,
  COUNT(*) as count
FROM attachments
UNION ALL
SELECT 
  'message_attachments' as table_name,
  COUNT(*) as count
FROM message_attachments
UNION ALL
SELECT 
  'chatbot_escalations' as table_name,
  COUNT(*) as count
FROM chatbot_escalations
UNION ALL
SELECT 
  'chatbot_messages' as table_name,
  COUNT(*) as count
FROM chatbot_messages
UNION ALL
SELECT 
  'chatbot_conversations' as table_name,
  COUNT(*) as count
FROM chatbot_conversations
UNION ALL
SELECT 
  'tutor_notifications' as table_name,
  COUNT(*) as count
FROM tutor_notifications
UNION ALL
SELECT 
  'forum_posts' as table_name,
  COUNT(*) as count
FROM forum_posts
UNION ALL
SELECT 
  'forum_replies' as table_name,
  COUNT(*) as count
FROM forum_replies
UNION ALL
SELECT 
  'forum_attachments' as table_name,
  COUNT(*) as count
FROM forum_attachments
UNION ALL
SELECT 
  'questions' as table_name,
  COUNT(*) as count
FROM questions
UNION ALL
SELECT 
  'answers' as table_name,
  COUNT(*) as count
FROM answers
UNION ALL
SELECT 
  'answer_replies' as table_name,
  COUNT(*) as count
FROM answer_replies
UNION ALL
SELECT 
  'answer_reply_attachments' as table_name,
  COUNT(*) as count
FROM answer_reply_attachments
UNION ALL
SELECT 
  'topic_resources' as table_name,
  COUNT(*) as count
FROM topic_resources
UNION ALL
SELECT 
  'notifications' as table_name,
  COUNT(*) as count
FROM notifications;

-- Delete in correct order to respect foreign key constraints
-- 1. Delete notifications first
DELETE FROM notifications;

-- 2. Delete tutor notifications (references escalations)
DELETE FROM tutor_notifications;

-- 3. Delete chatbot messages (references conversations)
DELETE FROM chatbot_messages;

-- 4. Delete chatbot escalations (references conversations)
DELETE FROM chatbot_escalations;

-- 5. Delete chatbot conversations
DELETE FROM chatbot_conversations;

-- 6. Delete answer reply attachments (references answer_replies)
DELETE FROM answer_reply_attachments;

-- 7. Delete answer replies (references answers)
DELETE FROM answer_replies;

-- 8. Delete answers (references questions)
DELETE FROM answers;

-- 9. Delete questions (references topics)
DELETE FROM questions;

-- 10. Delete forum attachments (references posts/replies)
DELETE FROM forum_attachments;

-- 11. Delete forum replies (references posts)
DELETE FROM forum_replies;

-- 12. Delete forum posts
DELETE FROM forum_posts;

-- 13. Delete topic resources (references topics/answers)
DELETE FROM topic_resources;

-- 14. Delete message attachments (junction table)
DELETE FROM message_attachments;

-- 15. Delete attachments (files uploaded with messages)
DELETE FROM attachments;

-- 16. Delete individual messages (including escalation messages)
DELETE FROM messages;

-- Verify deletion
SELECT 
  'messages' as table_name,
  COUNT(*) as remaining_count
FROM messages
UNION ALL
SELECT 
  'attachments' as table_name,
  COUNT(*) as remaining_count
FROM attachments
UNION ALL
SELECT 
  'message_attachments' as table_name,
  COUNT(*) as remaining_count
FROM message_attachments
UNION ALL
SELECT 
  'chatbot_escalations' as table_name,
  COUNT(*) as remaining_count
FROM chatbot_escalations
UNION ALL
SELECT 
  'chatbot_messages' as table_name,
  COUNT(*) as remaining_count
FROM chatbot_messages
UNION ALL
SELECT 
  'chatbot_conversations' as table_name,
  COUNT(*) as remaining_count
FROM chatbot_conversations
UNION ALL
SELECT 
  'tutor_notifications' as table_name,
  COUNT(*) as remaining_count
FROM tutor_notifications
UNION ALL
SELECT 
  'forum_posts' as table_name,
  COUNT(*) as remaining_count
FROM forum_posts
UNION ALL
SELECT 
  'forum_replies' as table_name,
  COUNT(*) as remaining_count
FROM forum_replies
UNION ALL
SELECT 
  'forum_attachments' as table_name,
  COUNT(*) as remaining_count
FROM forum_attachments
UNION ALL
SELECT 
  'questions' as table_name,
  COUNT(*) as remaining_count
FROM questions
UNION ALL
SELECT 
  'answers' as table_name,
  COUNT(*) as remaining_count
FROM answers
UNION ALL
SELECT 
  'answer_replies' as table_name,
  COUNT(*) as remaining_count
FROM answer_replies
UNION ALL
SELECT 
  'answer_reply_attachments' as table_name,
  COUNT(*) as remaining_count
FROM answer_reply_attachments
UNION ALL
SELECT 
  'topic_resources' as table_name,
  COUNT(*) as remaining_count
FROM topic_resources
UNION ALL
SELECT 
  'notifications' as table_name,
  COUNT(*) as remaining_count
FROM notifications;
