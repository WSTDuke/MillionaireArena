-- Add mmr column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mmr INTEGER DEFAULT NULL;

-- Description of MMR system:
-- NULL: Unranked
-- 0-299: Bronze III-I
-- 300-599: Silver III-I
-- 600-899: Gold III-I
-- 900-1199: Platinum III-I
-- 1200-1499: Diamond III-I
-- 1500-2499: Master
-- 2500+: Challenger
