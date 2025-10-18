-- Chatbot Escalations Table
CREATE TABLE IF NOT EXISTS chatbot_escalations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tutor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    module_code VARCHAR(20),
    original_question TEXT NOT NULL,
    escalation_reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'resolved', 'cancelled')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    message_thread_id UUID, -- Reference to the created message thread
    assigned_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tutor Notifications Table
CREATE TABLE IF NOT EXISTS tutor_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    escalation_id UUID NOT NULL REFERENCES chatbot_escalations(id) ON DELETE CASCADE,
    notification_type VARCHAR(20) NOT NULL CHECK (notification_type IN ('email', 'sms', 'in_app')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'read')),
    sent_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chatbot_escalations_student_id ON chatbot_escalations(student_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_escalations_tutor_id ON chatbot_escalations(tutor_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_escalations_status ON chatbot_escalations(status);
CREATE INDEX IF NOT EXISTS idx_chatbot_escalations_module_code ON chatbot_escalations(module_code);
CREATE INDEX IF NOT EXISTS idx_chatbot_escalations_created_at ON chatbot_escalations(created_at);

CREATE INDEX IF NOT EXISTS idx_tutor_notifications_tutor_id ON tutor_notifications(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutor_notifications_escalation_id ON tutor_notifications(escalation_id);
CREATE INDEX IF NOT EXISTS idx_tutor_notifications_status ON tutor_notifications(status);

-- Update trigger for escalations
CREATE OR REPLACE FUNCTION update_chatbot_escalation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_chatbot_escalations_updated_at ON chatbot_escalations;
CREATE TRIGGER update_chatbot_escalations_updated_at
    BEFORE UPDATE ON chatbot_escalations
    FOR EACH ROW
    EXECUTE FUNCTION update_chatbot_escalation_updated_at();

-- RLS Policies (no restrictions for now as requested)
ALTER TABLE chatbot_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read chatbot escalations" ON chatbot_escalations;
DROP POLICY IF EXISTS "Anyone can insert chatbot escalations" ON chatbot_escalations;
DROP POLICY IF EXISTS "Anyone can update chatbot escalations" ON chatbot_escalations;
DROP POLICY IF EXISTS "Anyone can delete chatbot escalations" ON chatbot_escalations;

DROP POLICY IF EXISTS "Anyone can read tutor notifications" ON tutor_notifications;
DROP POLICY IF EXISTS "Anyone can insert tutor notifications" ON tutor_notifications;
DROP POLICY IF EXISTS "Anyone can update tutor notifications" ON tutor_notifications;
DROP POLICY IF EXISTS "Anyone can delete tutor notifications" ON tutor_notifications;

-- Create policies allowing all authenticated users full access
CREATE POLICY "Anyone can read chatbot escalations" ON chatbot_escalations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can insert chatbot escalations" ON chatbot_escalations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Anyone can update chatbot escalations" ON chatbot_escalations
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can delete chatbot escalations" ON chatbot_escalations
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can read tutor notifications" ON tutor_notifications
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can insert tutor notifications" ON tutor_notifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Anyone can update tutor notifications" ON tutor_notifications
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can delete tutor notifications" ON tutor_notifications
    FOR DELETE USING (auth.role() = 'authenticated');

-- Comments
COMMENT ON TABLE chatbot_escalations IS 'Tracks chatbot escalations to human tutors';
COMMENT ON COLUMN chatbot_escalations.conversation_id IS 'Reference to the chatbot conversation';
COMMENT ON COLUMN chatbot_escalations.student_id IS 'Student who needs help';
COMMENT ON COLUMN chatbot_escalations.tutor_id IS 'Assigned tutor (null if pending)';
COMMENT ON COLUMN chatbot_escalations.module_code IS 'Module the question relates to';
COMMENT ON COLUMN chatbot_escalations.original_question IS 'The question that triggered escalation';
COMMENT ON COLUMN chatbot_escalations.escalation_reason IS 'Reason for escalation (low confidence, complex topic, etc.)';
COMMENT ON COLUMN chatbot_escalations.status IS 'Current status of the escalation';
COMMENT ON COLUMN chatbot_escalations.priority IS 'Priority level of the escalation';
COMMENT ON COLUMN chatbot_escalations.message_thread_id IS 'ID of the created message thread between student and tutor';

COMMENT ON TABLE tutor_notifications IS 'Tracks notifications sent to tutors about escalations';
COMMENT ON COLUMN tutor_notifications.tutor_id IS 'Tutor who was notified';
COMMENT ON COLUMN tutor_notifications.escalation_id IS 'Escalation that triggered the notification';
COMMENT ON COLUMN tutor_notifications.notification_type IS 'Type of notification sent';
COMMENT ON COLUMN tutor_notifications.status IS 'Status of the notification';
