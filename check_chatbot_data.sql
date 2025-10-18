-- Check chatbot tables for stored data
-- Run these queries to see if conversations and messages are being saved

-- 1. Check all chatbot conversations
SELECT 
    id,
    user_id,
    title,
    message_count,
    is_active,
    context_limit_reached,
    created_at,
    updated_at
FROM chatbot_conversations 
ORDER BY created_at DESC;

-- 2. Check all chatbot messages
SELECT 
    id,
    conversation_id,
    content,
    is_from_bot,
    escalated_to_tutor,
    tutor_module,
    confidence_score,
    created_at
FROM chatbot_messages 
ORDER BY created_at DESC;

-- 3. Check conversations for a specific user (replace with your user ID)
SELECT 
    id,
    user_id,
    title,
    message_count,
    is_active,
    context_limit_reached,
    created_at,
    updated_at
FROM chatbot_conversations 
WHERE user_id = '88f25b63-37ea-4f8e-a860-17bc9ca6972b'  -- Replace with your actual user ID
ORDER BY created_at DESC;

-- 4. Check messages for a specific conversation
SELECT 
    id,
    conversation_id,
    content,
    is_from_bot,
    escalated_to_tutor,
    tutor_module,
    confidence_score,
    created_at
FROM chatbot_messages 
WHERE conversation_id = 'feef8bfd-a035-4fb2-bdc5-a3545253057f'  -- Replace with actual conversation ID
ORDER BY created_at ASC;

-- 5. Count total conversations and messages
SELECT 
    (SELECT COUNT(*) FROM chatbot_conversations) as total_conversations,
    (SELECT COUNT(*) FROM chatbot_messages) as total_messages;

-- 6. Check if RLS is disabled (should show rowsecurity = false)
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename IN ('chatbot_conversations', 'chatbot_messages', 'chatbot_escalations', 'tutor_notifications');
