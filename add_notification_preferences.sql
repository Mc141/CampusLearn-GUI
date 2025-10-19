-- Add email notification preferences to users table
-- Run this in Supabase SQL editor

-- Add email notification preference columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS sms_notifications BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "in_app": true}'::jsonb;

-- Create index for notification preferences
CREATE INDEX IF NOT EXISTS idx_users_notification_preferences ON users(email_notifications);

-- Update existing users to have email notifications enabled by default
UPDATE users 
SET email_notifications = TRUE, 
    notification_preferences = '{"email": true, "sms": false, "in_app": true}'::jsonb
WHERE email_notifications IS NULL;

-- Verify the changes
SELECT id, email, email_notifications, sms_notifications, notification_preferences 
FROM users 
LIMIT 5;

