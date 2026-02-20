-- Migration: Add conversation persistence features
-- Date: 2025-02-19
-- Description: Restructure conversations and itineraries relationship for better persistence

-- Step 1: Add new columns to conversations (safe, additive)
ALTER TABLE public.conversations 
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 2: Add conversation_id to itineraries (safe, additive)
ALTER TABLE public.itineraries 
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL;

-- Step 3: Migrate existing data (if any)
-- Copy thread_id to conversation_id for existing itineraries
UPDATE public.itineraries 
SET conversation_id = thread_id 
WHERE thread_id IS NOT NULL AND conversation_id IS NULL;

-- Step 4: Drop old columns (only after data migration)
ALTER TABLE public.itineraries 
  DROP COLUMN IF EXISTS thread_id;

ALTER TABLE public.conversations 
  DROP COLUMN IF EXISTS itinerary_id;

-- Step 5: Create new indexes
CREATE INDEX IF NOT EXISTS idx_itineraries_conversation_id 
  ON public.itineraries(conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversations_active 
  ON public.conversations(user_id, is_active, last_message_at DESC);

-- Step 6: Drop old indexes
DROP INDEX IF EXISTS idx_conversations_itinerary_id;

-- Step 7: Update RLS policies (no changes needed, existing policies still work)

-- Step 8: Create helper function to get active conversation
CREATE OR REPLACE FUNCTION public.get_active_conversation(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  messages JSONB,
  state JSONB,
  is_active BOOLEAN,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  latest_itinerary JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.user_id,
    c.messages,
    c.state,
    c.is_active,
    c.last_message_at,
    c.created_at,
    c.updated_at,
    (
      SELECT row_to_json(i.*)
      FROM public.itineraries i
      WHERE i.conversation_id = c.id
      ORDER BY i.created_at DESC
      LIMIT 1
    ) as latest_itinerary
  FROM public.conversations c
  WHERE c.user_id = p_user_id
    AND c.is_active = true
  ORDER BY c.last_message_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_active_conversation(UUID) TO authenticated;

-- Step 9: Create trigger to update last_message_at
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_message_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_last_message_trigger
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  WHEN (OLD.messages IS DISTINCT FROM NEW.messages)
  EXECUTE FUNCTION public.update_conversation_last_message();

-- Migration complete
-- Run this in Supabase SQL Editor
