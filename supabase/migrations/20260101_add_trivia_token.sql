-- Add columns for Open Trivia DB session token to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS opentdb_token TEXT,
ADD COLUMN IF NOT EXISTS opentdb_token_expires_at TIMESTAMPTZ;

-- Comment for clarity
COMMENT ON COLUMN profiles.opentdb_token IS 'Session token for Open Trivia DB to avoid duplicate questions';
COMMENT ON COLUMN profiles.opentdb_token_expires_at IS 'Expiration time for the Open Trivia DB session token (usually 6 hours after last use)';
