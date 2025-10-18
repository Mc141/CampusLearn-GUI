-- Temporarily disable RLS on notifications table for testing
-- WARNING: This removes security, only use for testing!

-- Disable RLS
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;

-- Create a simple policy that allows all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON notifications
    FOR ALL USING (auth.role() = 'authenticated');

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
