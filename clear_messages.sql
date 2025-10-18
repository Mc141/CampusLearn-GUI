-- Clear All One-on-One Messages Script
-- This script will delete all private messages between users
-- WARNING: This will permanently delete all message data!

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
FROM message_attachments;

-- Delete in correct order to respect foreign key constraints
-- 1. Delete message attachments (junction table)
DELETE FROM message_attachments;

-- 2. Delete attachments (files uploaded with messages)
DELETE FROM attachments;

-- 3. Delete individual messages
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
FROM message_attachments;
