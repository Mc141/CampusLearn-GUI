-- Check current tutors and their modules
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.role,
    u.modules,
    u.is_active
FROM users u
WHERE u.role = 'tutor'
ORDER BY u.first_name;

-- Check what modules exist
SELECT 
    m.id,
    m.name,
    m.code,
    m.level
FROM modules m
ORDER BY m.code;

-- Check if there are any tutors assigned to topics
SELECT 
    tt.tutor_id,
    u.first_name,
    u.last_name,
    t.title,
    t.module_code
FROM topic_tutors tt
JOIN users u ON tt.tutor_id = u.id
JOIN topics t ON tt.topic_id = t.id
ORDER BY u.first_name;
