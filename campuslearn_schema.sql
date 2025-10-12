-- CampusLearn™ Database Schema for Supabase
-- This schema covers all functional requirements and frontend data models

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS (Row Level Security) - but we'll keep it simple without policies for now
-- ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- ==============================================
-- CORE TABLES
-- ==============================================

-- Modules table (BCom, BIT, Diploma modules)
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    level VARCHAR(50) NOT NULL CHECK (level IN ('BCom', 'BIT', 'Diploma')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (students, tutors, admins)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'tutor', 'admin')),
    student_number VARCHAR(20),
    profile_picture TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- User modules (many-to-many relationship)
CREATE TABLE user_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, module_id)
);

-- Topics table
CREATE TABLE topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    module_code VARCHAR(20) NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Topic subscriptions (many-to-many)
CREATE TABLE topic_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(topic_id, user_id)
);

-- Topic tutors (many-to-many)
CREATE TABLE topic_tutors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(topic_id, tutor_id)
);

-- Questions table
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed')),
    upvotes INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Answers table
CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_accepted BOOLEAN DEFAULT false,
    upvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attachments table (for answers, messages, resources)
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('pdf', 'video', 'audio', 'image', 'link')),
    url TEXT NOT NULL,
    size BIGINT,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Answer attachments (many-to-many)
CREATE TABLE answer_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    answer_id UUID NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
    attachment_id UUID NOT NULL REFERENCES attachments(id) ON DELETE CASCADE,
    UNIQUE(answer_id, attachment_id)
);

-- Messages table (private messaging)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message attachments (many-to-many)
CREATE TABLE message_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    attachment_id UUID NOT NULL REFERENCES attachments(id) ON DELETE CASCADE,
    UNIQUE(message_id, attachment_id)
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('question', 'answer', 'message', 'topic', 'system')),
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum posts table
CREATE TABLE forum_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_anonymous BOOLEAN DEFAULT false,
    upvotes INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    is_moderated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum replies table
CREATE TABLE forum_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_anonymous BOOLEAN DEFAULT false,
    upvotes INTEGER DEFAULT 0,
    is_moderated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table (AI chatbot)
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_from_ai BOOLEAN DEFAULT false,
    suggestions TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resources table (learning materials)
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('pdf', 'video', 'audio', 'image', 'link')),
    url TEXT NOT NULL,
    module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    size BIGINT,
    downloads INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FAQ table
CREATE TABLE faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    tags TEXT[] DEFAULT '{}',
    is_published BOOLEAN DEFAULT true,
    views INTEGER DEFAULT 0,
    helpful INTEGER DEFAULT 0,
    not_helpful INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tutor applications table
CREATE TABLE tutor_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    experience TEXT,
    qualifications TEXT,
    motivation TEXT,
    availability TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tutor application modules (many-to-many)
CREATE TABLE tutor_application_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES tutor_applications(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    UNIQUE(application_id, module_id)
);

-- Tutor matching requests
CREATE TABLE tutor_matching_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module_code VARCHAR(20) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    urgency VARCHAR(20) DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'completed')),
    matched_tutor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification templates (for admin management)
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'sms', 'whatsapp')),
    subject VARCHAR(255),
    content TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_student_number ON users(student_number);

-- Topic indexes
CREATE INDEX idx_topics_module_code ON topics(module_code);
CREATE INDEX idx_topics_created_by ON topics(created_by);
CREATE INDEX idx_topics_is_active ON topics(is_active);

-- Question indexes
CREATE INDEX idx_questions_topic_id ON questions(topic_id);
CREATE INDEX idx_questions_student_id ON questions(student_id);
CREATE INDEX idx_questions_status ON questions(status);
CREATE INDEX idx_questions_created_at ON questions(created_at);

-- Answer indexes
CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_answers_tutor_id ON answers(tutor_id);

-- Message indexes
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Notification indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Forum indexes
CREATE INDEX idx_forum_posts_created_at ON forum_posts(created_at);
CREATE INDEX idx_forum_posts_upvotes ON forum_posts(upvotes);
CREATE INDEX idx_forum_replies_post_id ON forum_replies(post_id);

-- Resource indexes
CREATE INDEX idx_resources_module_id ON resources(module_id);
CREATE INDEX idx_resources_uploaded_by ON resources(uploaded_by);
CREATE INDEX idx_resources_type ON resources(type);

-- ==============================================
-- TRIGGERS FOR UPDATED_AT
-- ==============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON topics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_answers_updated_at BEFORE UPDATE ON answers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON forum_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forum_replies_updated_at BEFORE UPDATE ON forum_replies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON faqs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tutor_applications_updated_at BEFORE UPDATE ON tutor_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tutor_matching_requests_updated_at BEFORE UPDATE ON tutor_matching_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- SAMPLE DATA INSERTION
-- ==============================================

-- Insert sample modules
INSERT INTO modules (id, name, code, description, level) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Data Science Fundamentals', 'BCS101', 'Introduction to data science, statistics, and machine learning concepts', 'BCom'),
('550e8400-e29b-41d4-a716-446655440002', 'Software Engineering Principles', 'BCS102', 'Software development methodologies, design patterns, and best practices', 'BCom'),
('550e8400-e29b-41d4-a716-446655440003', 'Web Development', 'BIT101', 'Modern web development using HTML, CSS, JavaScript, and frameworks', 'BIT'),
('550e8400-e29b-41d4-a716-446655440004', 'Database Systems', 'BIT102', 'Database design, SQL, NoSQL, and data management systems', 'BIT'),
('550e8400-e29b-41d4-a716-446655440005', 'IT Infrastructure', 'DIP101', 'Network administration, system administration, and cloud computing', 'Diploma'),
('550e8400-e29b-41d4-a716-446655440006', 'Mobile App Development', 'DIP102', 'Cross-platform mobile application development', 'Diploma'),
('550e8400-e29b-41d4-a716-446655440007', 'Cybersecurity Fundamentals', 'BCS201', 'Information security, ethical hacking, and risk management', 'BCom'),
('550e8400-e29b-41d4-a716-446655440008', 'Artificial Intelligence', 'BCS202', 'AI algorithms, neural networks, and intelligent systems', 'BCom');

-- Insert sample users
INSERT INTO users (id, email, first_name, last_name, role, student_number) VALUES
('550e8400-e29b-41d4-a716-446655440010', '577963@student.belgiumcampus.ac.za', 'John', 'Doe', 'student', 'BC2023001'),
('550e8400-e29b-41d4-a716-446655440011', 'tutor@belgiumcampus.ac.za', 'Jane', 'Smith', 'tutor', 'BC2022001'),
('550e8400-e29b-41d4-a716-446655440012', 'admin@belgiumcampus.ac.za', 'Admin', 'User', 'admin', NULL);

-- Insert sample user modules
INSERT INTO user_modules (user_id, module_id) VALUES
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440004');

-- Insert sample topics
INSERT INTO topics (id, title, description, module_code, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440020', 'Machine Learning Algorithms', 'Understanding supervised and unsupervised learning algorithms, model evaluation, and optimization techniques', 'BCS101', '550e8400-e29b-41d4-a716-446655440011'),
('550e8400-e29b-41d4-a716-446655440021', 'React Development', 'Building modern web applications with React, hooks, and state management', 'BIT101', '550e8400-e29b-41d4-a716-446655440011'),
('550e8400-e29b-41d4-a716-446655440022', 'Database Design Patterns', 'Normalization, indexing strategies, and performance optimization', 'BIT102', '550e8400-e29b-41d4-a716-446655440011');

-- Insert sample topic subscriptions
INSERT INTO topic_subscriptions (topic_id, user_id) VALUES
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440010'),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440010');

-- Insert sample topic tutors
INSERT INTO topic_tutors (topic_id, tutor_id) VALUES
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440011'),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440011'),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440011');

-- Insert sample questions
INSERT INTO questions (id, topic_id, student_id, title, content, is_anonymous, status, upvotes, tags) VALUES
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440010', 'How to choose the right ML algorithm?', 'I''m working on a classification problem with 1000 features and 10,000 samples. Should I use Random Forest, SVM, or Neural Networks? What factors should I consider?', false, 'answered', 8, ARRAY['machine-learning', 'classification', 'algorithm-selection']),
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440010', 'React hooks vs class components', 'What are the advantages of using React hooks over class components? When should I migrate my existing class components to hooks?', true, 'open', 5, ARRAY['react', 'hooks', 'components']);

-- Insert sample answers
INSERT INTO answers (id, question_id, tutor_id, content, is_accepted, upvotes) VALUES
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440011', 'For your classification problem with 1000 features and 10,000 samples, I''d recommend starting with Random Forest. It''s robust to overfitting, handles high-dimensional data well, and provides feature importance. If you need better performance, try Gradient Boosting (XGBoost/LightGBM). Neural Networks might be overkill unless you have complex non-linear patterns.', true, 12);

-- Insert sample FAQ
INSERT INTO faqs (question, answer, category, tags) VALUES
('How do I register as a peer tutor?', 'To register as a peer tutor, go to the Tutor Registration page and fill out the application form. You''ll need to provide your academic background, teaching experience, and motivation statement. Applications are reviewed within 2-3 business days.', 'Tutoring', ARRAY['registration', 'tutor', 'application']),
('What file types can I upload as learning resources?', 'You can upload PDFs, videos (MP4, AVI), audio files (MP3, WAV), images (JPG, PNG), and links to external resources. Maximum file size is 50MB per file.', 'Resources', ARRAY['upload', 'files', 'resources']);

-- Insert sample notification templates
INSERT INTO notification_templates (name, type, subject, content, variables) VALUES
('New Question Alert', 'email', 'New Question in {{topic}}', 'A new question has been posted in {{topic}} by {{student}}. Please review and respond.', ARRAY['topic', 'student']),
('Answer Received', 'sms', '', 'Your question about {{topic}} has been answered by {{tutor}}. Check CampusLearn for details.', ARRAY['topic', 'tutor']),
('Weekly Summary', 'whatsapp', '', 'Weekly summary: {{questions}} questions asked, {{answers}} answers provided. Keep up the great work!', ARRAY['questions', 'answers']);

-- ==============================================
-- VIEWS FOR COMMON QUERIES
-- ==============================================

-- View for user profiles with module information
CREATE VIEW user_profiles AS
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    u.student_number,
    u.profile_picture,
    u.is_active,
    u.created_at,
    u.last_login,
    ARRAY_AGG(m.code) as module_codes,
    ARRAY_AGG(m.name) as module_names
FROM users u
LEFT JOIN user_modules um ON u.id = um.user_id
LEFT JOIN modules m ON um.module_id = m.id
GROUP BY u.id, u.email, u.first_name, u.last_name, u.role, u.student_number, u.profile_picture, u.is_active, u.created_at, u.last_login;

-- View for topics with subscriber and tutor counts
CREATE VIEW topic_details AS
SELECT 
    t.id,
    t.title,
    t.description,
    t.module_code,
    t.created_by,
    t.is_active,
    t.created_at,
    t.updated_at,
    COUNT(DISTINCT ts.user_id) as subscriber_count,
    COUNT(DISTINCT tt.tutor_id) as tutor_count,
    u.first_name as creator_first_name,
    u.last_name as creator_last_name
FROM topics t
LEFT JOIN topic_subscriptions ts ON t.id = ts.topic_id
LEFT JOIN topic_tutors tt ON t.id = tt.topic_id
LEFT JOIN users u ON t.created_by = u.id
GROUP BY t.id, t.title, t.description, t.module_code, t.created_by, t.is_active, t.created_at, t.updated_at, u.first_name, u.last_name;

-- View for questions with answer counts
CREATE VIEW question_details AS
SELECT 
    q.id,
    q.topic_id,
    q.student_id,
    q.title,
    q.content,
    q.is_anonymous,
    q.status,
    q.upvotes,
    q.tags,
    q.created_at,
    q.updated_at,
    COUNT(a.id) as answer_count,
    t.title as topic_title,
    t.module_code,
    u.first_name as student_first_name,
    u.last_name as student_last_name
FROM questions q
LEFT JOIN answers a ON q.id = a.question_id
LEFT JOIN topics t ON q.topic_id = t.id
LEFT JOIN users u ON q.student_id = u.id
GROUP BY q.id, q.topic_id, q.student_id, q.title, q.content, q.is_anonymous, q.status, q.upvotes, q.tags, q.created_at, q.updated_at, t.title, t.module_code, u.first_name, u.last_name;

-- ==============================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- ==============================================

-- Function to get user's subscribed topics
CREATE OR REPLACE FUNCTION get_user_subscribed_topics(user_uuid UUID)
RETURNS TABLE (
    topic_id UUID,
    title VARCHAR(255),
    description TEXT,
    module_code VARCHAR(20),
    subscribed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.title,
        t.description,
        t.module_code,
        ts.subscribed_at
    FROM topics t
    JOIN topic_subscriptions ts ON t.id = ts.topic_id
    WHERE ts.user_id = user_uuid AND t.is_active = true
    ORDER BY ts.subscribed_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's managed topics (for tutors)
CREATE OR REPLACE FUNCTION get_user_managed_topics(user_uuid UUID)
RETURNS TABLE (
    topic_id UUID,
    title VARCHAR(255),
    description TEXT,
    module_code VARCHAR(20),
    assigned_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.title,
        t.description,
        t.module_code,
        tt.assigned_at
    FROM topics t
    JOIN topic_tutors tt ON t.id = tt.topic_id
    WHERE tt.tutor_id = user_uuid AND t.is_active = true
    ORDER BY tt.assigned_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get unanswered questions for a tutor
CREATE OR REPLACE FUNCTION get_unanswered_questions_for_tutor(tutor_uuid UUID)
RETURNS TABLE (
    question_id UUID,
    title VARCHAR(255),
    content TEXT,
    topic_title VARCHAR(255),
    module_code VARCHAR(20),
    student_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    upvotes INTEGER,
    tags TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id,
        q.title,
        q.content,
        t.title as topic_title,
        t.module_code,
        CONCAT(u.first_name, ' ', u.last_name) as student_name,
        q.created_at,
        q.upvotes,
        q.tags
    FROM questions q
    JOIN topics t ON q.topic_id = t.id
    JOIN topic_tutors tt ON t.id = tt.topic_id
    JOIN users u ON q.student_id = u.id
    WHERE tt.tutor_id = tutor_uuid 
        AND q.status = 'open'
        AND NOT EXISTS (
            SELECT 1 FROM answers a WHERE a.question_id = q.id AND a.tutor_id = tutor_uuid
        )
    ORDER BY q.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- COMMENTS
-- ==============================================

COMMENT ON TABLE users IS 'Core user table for students, tutors, and admins';
COMMENT ON TABLE modules IS 'Academic modules (BCom, BIT, Diploma)';
COMMENT ON TABLE topics IS 'Learning topics created by tutors';
COMMENT ON TABLE questions IS 'Questions asked by students';
COMMENT ON TABLE answers IS 'Answers provided by tutors';
COMMENT ON TABLE messages IS 'Private messages between users';
COMMENT ON TABLE notifications IS 'System notifications for users';
COMMENT ON TABLE forum_posts IS 'Public forum posts (anonymous allowed)';
COMMENT ON TABLE resources IS 'Learning resources uploaded by tutors';
COMMENT ON TABLE faqs IS 'Frequently asked questions';
COMMENT ON TABLE tutor_applications IS 'Tutor registration applications';
COMMENT ON TABLE tutor_matching_requests IS 'Student requests for tutor matching';

-- ==============================================
-- FINAL NOTES
-- ==============================================

-- This schema provides:
-- 1. Complete user management with role-based access
-- 2. Module and topic management
-- 3. Question and answer system
-- 4. Private messaging
-- 5. Public forum with anonymous posting
-- 6. Resource management
-- 7. Notification system
-- 8. Tutor application and matching system
-- 9. FAQ management
-- 10. Chat system for AI integration

-- The schema is designed to be:
-- - Scalable with proper indexing
-- - Flexible with JSON arrays for tags
-- - Maintainable with triggers for updated_at
-- - Query-optimized with views and functions
-- - Ready for Supabase integration

-- To use this schema:
-- 1. Run this SQL in your Supabase SQL editor
-- 2. The schema will create all tables, indexes, triggers, and sample data
-- 3. You can then connect your React frontend to Supabase
-- 4. Use Supabase client libraries for real-time features
-- 5. Implement Row Level Security policies as needed
