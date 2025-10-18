-- Add some test tutors with modules for testing escalation
-- First, let's see what modules exist
SELECT * FROM modules LIMIT 10;

-- Add a test tutor with BCS101 module
INSERT INTO users (
    email,
    first_name,
    last_name,
    role,
    modules,
    is_active
) VALUES (
    'tutor1@belgiumcampus.ac.za',
    'John',
    'Doe',
    'tutor',
    '["BCS101", "BCS102"]'::jsonb,
    true
) ON CONFLICT (email) DO UPDATE SET
    modules = '["BCS101", "BCS102"]'::jsonb,
    role = 'tutor',
    is_active = true;

-- Add another test tutor with DIP101 module
INSERT INTO users (
    email,
    first_name,
    last_name,
    role,
    modules,
    is_active
) VALUES (
    'tutor2@belgiumcampus.ac.za',
    'Jane',
    'Smith',
    'tutor',
    '["DIP101", "DIP102"]'::jsonb,
    true
) ON CONFLICT (email) DO UPDATE SET
    modules = '["DIP101", "DIP102"]'::jsonb,
    role = 'tutor',
    is_active = true;

-- Add a general tutor (for General escalations)
INSERT INTO users (
    email,
    first_name,
    last_name,
    role,
    modules,
    is_active
) VALUES (
    'tutor3@belgiumcampus.ac.za',
    'Bob',
    'Johnson',
    'tutor',
    '["BCS101", "DIP101", "General"]'::jsonb,
    true
) ON CONFLICT (email) DO UPDATE SET
    modules = '["BCS101", "DIP101", "General"]'::jsonb,
    role = 'tutor',
    is_active = true;

-- Verify the tutors were added/updated
SELECT 
    id,
    email,
    first_name,
    last_name,
    role,
    modules,
    is_active
FROM users 
WHERE role = 'tutor' 
ORDER BY first_name;
