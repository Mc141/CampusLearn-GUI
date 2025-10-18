-- Clear Messages and Reset System
-- Run this script, then follow the browser instructions below

-- Clear all message tables
DELETE FROM tutor_notifications;
DELETE FROM chatbot_messages;
DELETE FROM chatbot_escalations;
DELETE FROM chatbot_conversations;
DELETE FROM message_attachments;
DELETE FROM attachments;
DELETE FROM messages;
DELETE FROM chat_messages;

-- Verify everything is cleared
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

-- IMPORTANT: After running this script, you MUST:
-- 1. Close your browser completely
-- 2. Clear browser cache (Ctrl+Shift+Delete)
-- 3. Or open an incognito/private window
-- 4. Restart your development server
-- 5. Refresh the page

-- The messages are being recreated because the RealtimeChat system
-- stores them in memory and syncs them back to the database on page load.
-- Clearing the browser cache will remove the in-memory messages.
