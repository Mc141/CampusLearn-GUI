-- Clear ALL Message Tables Script
-- This script will delete ALL messages from ALL message-related tables
-- WARNING: This will permanently delete ALL message data!

-- First, let's see what we're about to delete
SELECT 
  'messages' as table_name,
  COUNT(*) as count
FROM messages
UNION ALL
SELECT 
  'chat_messages' as table_name,
  COUNT(*) as count
FROM chat_messages
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
FROM tutor_notifications;

-- Delete in correct order to respect foreign key constraints
-- 1. Delete tutor notifications (references escalations)
DELETE FROM tutor_notifications;

-- 2. Delete chatbot messages (references conversations)
DELETE FROM chatbot_messages;

-- 3. Delete chatbot escalations (references conversations)
DELETE FROM chatbot_escalations;

-- 4. Delete chatbot conversations
DELETE FROM chatbot_conversations;

-- 5. Delete message attachments (junction table) - this might be causing issues
DELETE FROM message_attachments;

-- 6. Delete individual messages (including escalation messages)
DELETE FROM messages;

-- 7. Delete chat messages (separate chat system)
DELETE FROM chat_messages;

-- 8. Delete attachments LAST (after all references are removed)
DELETE FROM attachments;

-- Verify deletion
SELECT 
  'messages' as table_name,
  COUNT(*) as remaining_count
FROM messages
UNION ALL
SELECT 
  'chat_messages' as table_name,
  COUNT(*) as remaining_count
FROM chat_messages
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
FROM tutor_notifications;
