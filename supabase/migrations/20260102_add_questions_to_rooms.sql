-- Add questions column to rooms table to synchronize questions between players
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS questions JSONB;
