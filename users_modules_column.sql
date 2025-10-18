-- users_modules_column.sql
-- Add modules column to users table

-- Add modules column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS modules JSONB DEFAULT '[]';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_users_modules ON users USING GIN (modules);

-- Add comment for documentation
COMMENT ON COLUMN users.modules IS 'Array of module IDs that the user is enrolled in';
