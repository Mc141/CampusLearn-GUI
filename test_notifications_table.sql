-- Test script to verify notifications table and functionality
-- Run this in Supabase SQL editor to test

-- 1. Check if notifications table exists
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- 2. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'notifications';

-- 3. Test inserting a notification (replace with actual user ID)
-- INSERT INTO notifications (user_id, type, title, message, link)
-- VALUES (
--   'your-user-id-here', 
--   'new_message', 
--   'Test Notification', 
--   'This is a test notification', 
--   '/messages'
-- );

-- 4. Check if any notifications exist
SELECT COUNT(*) as total_notifications FROM notifications;

-- 5. Check notifications for a specific user (replace with actual user ID)
-- SELECT * FROM notifications WHERE user_id = 'your-user-id-here' ORDER BY created_at DESC;
