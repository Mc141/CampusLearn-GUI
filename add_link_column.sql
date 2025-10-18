-- Add missing 'link' column to notifications table
-- Run this in Supabase SQL editor

-- Add the link column if it doesn't exist
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS link TEXT;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND column_name = 'link';

-- Test insert a notification (replace with actual user ID)
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
