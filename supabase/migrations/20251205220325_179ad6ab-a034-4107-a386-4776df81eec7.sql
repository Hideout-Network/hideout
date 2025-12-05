-- Add source column to track where messages come from (website or discord)
ALTER TABLE public.global_chat ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'website';

-- Add user warnings table for tracking chat violations
CREATE TABLE IF NOT EXISTS public.chat_warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  warning_count int NOT NULL DEFAULT 0,
  timeout_until timestamp with time zone,
  last_message text,
  last_message_time timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on chat_warnings
ALTER TABLE public.chat_warnings ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own warnings
CREATE POLICY "Users can read their own warnings" ON public.chat_warnings
FOR SELECT USING (auth.uid() = user_id);

-- Allow service role to manage warnings (for edge function)
CREATE POLICY "Service role can manage warnings" ON public.chat_warnings
FOR ALL USING (true) WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_chat_warnings_username ON public.chat_warnings(username);
CREATE INDEX IF NOT EXISTS idx_chat_warnings_user_id ON public.chat_warnings(user_id);