-- users_profile_columns.sql
-- Add all missing profile columns to users table

-- Add modules column (if missing)
ALTER TABLE users ADD COLUMN IF NOT EXISTS modules JSONB DEFAULT '[]';

-- Add student_number column (if missing)
ALTER TABLE users ADD COLUMN IF NOT EXISTS student_number TEXT;

-- Add profile_picture column (if missing)
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT;

-- Add updated_at column (if missing)
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add last_login column (if missing)
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_modules ON users USING GIN (modules);
CREATE INDEX IF NOT EXISTS idx_users_student_number ON users(student_number);
CREATE INDEX IF NOT EXISTS idx_users_updated_at ON users(updated_at);

-- Add trigger for updated_at timestamps (if not exists)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON COLUMN users.modules IS 'Array of module IDs that the user is enrolled in';
COMMENT ON COLUMN users.student_number IS 'Student number for student users';
COMMENT ON COLUMN users.profile_picture IS 'URL to user profile picture';
COMMENT ON COLUMN users.updated_at IS 'Timestamp when user profile was last updated';
COMMENT ON COLUMN users.last_login IS 'Timestamp of user last login';
