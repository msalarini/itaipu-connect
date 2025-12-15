-- Add preferences column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{"push_notifications": true}'::jsonb;

-- Comment on column
COMMENT ON COLUMN public.profiles.preferences IS 'User preferences settings (jsonb)';
