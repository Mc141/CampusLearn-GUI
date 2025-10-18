-- Clear all tutor escalation tables and reset escalation counts
-- This will remove all escalation records and reset tutor workload

-- Clear escalation-related tables (in order to respect foreign keys)
DELETE FROM tutor_notifications;
DELETE FROM chatbot_escalations;
DELETE FROM chatbot_messages;
DELETE FROM chatbot_conversations;

-- Verify the tables are cleared
SELECT 'tutor_notifications' as table_name, COUNT(*) as remaining_records FROM tutor_notifications
UNION ALL
SELECT 'chatbot_escalations' as table_name, COUNT(*) as remaining_records FROM chatbot_escalations
UNION ALL
SELECT 'chatbot_messages' as table_name, COUNT(*) as remaining_records FROM chatbot_messages
UNION ALL
SELECT 'chatbot_conversations' as table_name, COUNT(*) as remaining_records FROM chatbot_conversations;

-- Show current tutor escalation counts (should all be 0)
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.modules,
    CASE 
        WHEN u.role = 'tutor' THEN 'Tutor'
        WHEN u.role = 'admin' THEN 'Admin'
        ELSE 'Student'
    END as user_role
FROM users u
WHERE u.role IN ('tutor', 'admin')
ORDER BY u.first_name, u.last_name;

-- Reset any escalation counters or statuses if they exist
-- (This is a placeholder in case there are escalation counters in the users table)
-- UPDATE users SET escalation_count = 0 WHERE role = 'tutor';

COMMIT;
