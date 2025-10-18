-- github_profile_fields.sql
-- Add GitHub profile fields to users table

-- Add GitHub-related columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_profile_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_location TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_website TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_company TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_github_username ON users(github_username);

-- Add comments for documentation
COMMENT ON COLUMN users.github_username IS 'GitHub username for the user';
COMMENT ON COLUMN users.github_profile_url IS 'Full GitHub profile URL';
COMMENT ON COLUMN users.github_bio IS 'GitHub bio/description';
COMMENT ON COLUMN users.github_location IS 'Location from GitHub profile';
COMMENT ON COLUMN users.github_website IS 'Website from GitHub profile';
COMMENT ON COLUMN users.github_company IS 'Company from GitHub profile';
