-- Migration 007: Add avatar_url column to users table
--
-- Stores a URL to the user's profile picture (uploaded to Supabase Storage).

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
