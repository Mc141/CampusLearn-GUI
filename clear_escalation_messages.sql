-- Clear Escalation-Related Messages
-- This script will delete messages that were created by the escalation system
-- WARNING: This will delete messages that contain escalation content!

-- First, let's see what escalation-related messages exist
SELECT 
  id,
  sender_id,
  receiver_id,
  content,
  created_at
FROM messages 
WHERE content LIKE '%assigned tutor for the CampusLearn AI escalation%'
   OR content LIKE '%Student Question:%'
   OR content LIKE '%Escalation Reason:%'
ORDER BY created_at DESC;

-- Delete messages that contain escalation-related content
DELETE FROM messages 
WHERE content LIKE '%assigned tutor for the CampusLearn AI escalation%'
   OR content LIKE '%Student Question:%'
   OR content LIKE '%Escalation Reason:%';

-- Also delete any messages that might be part of escalation conversations
-- (messages between users where one is a tutor and content suggests escalation context)
DELETE FROM messages 
WHERE content LIKE '%escalation%'
   OR content LIKE '%tutor assignment%'
   OR content LIKE '%CampusLearn AI%';

-- Verify deletion
SELECT 
  'messages' as table_name,
  COUNT(*) as remaining_count
FROM messages;

-- Show remaining messages to verify
SELECT 
  id,
  sender_id,
  receiver_id,
  LEFT(content, 100) as content_preview,
  created_at
FROM messages 
ORDER BY created_at DESC
LIMIT 10;
