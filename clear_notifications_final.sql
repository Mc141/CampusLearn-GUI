-- Clear all notifications and reset counter
-- Run this in Supabase SQL editor

-- Delete all notifications
DELETE FROM notifications;

-- Verify all notifications are deleted
SELECT COUNT(*) as remaining_notifications FROM notifications;

-- Check if table is empty
SELECT * FROM notifications LIMIT 5;
