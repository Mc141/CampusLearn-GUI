-- Remove ALL security rules from notifications table
-- WARNING: This removes all security - only use for testing!

-- Disable RLS completely
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON notifications;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'notifications';

-- Test insert (replace with actual user ID)
-- INSERT INTO notifications (user_id, type, title, message, link)
-- VALUES (
--   'your-user-id-here', 
--   'new_message', 
--   'Test Notification', 
--   'This is a test notification', 
--   '/messages'
-- );

-- Check if notification was inserted
-- SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5;
