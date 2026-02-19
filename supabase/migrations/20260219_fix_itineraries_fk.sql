-- Migration: Fix itineraries FK to point to auth.users instead of profiles
-- Run this AFTER dropping and recreating all tables (or run drop_recreate below)
-- Date: 2026-02-19

-- ─── Drop existing tables (safe for dev/test — wipes all data) ───────────
-- Uncomment the block below if you want to do a full reset:
/*
DROP TABLE IF EXISTS public.favorite_places CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.itineraries CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
*/

-- ─── Recreate schema with corrected FK ───────────────────────────────────

-- Profiles (stays the same — references auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    locale TEXT DEFAULT 'es',
    theme TEXT DEFAULT 'light',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Itineraries: user_id now points to auth.users(id) directly.
-- This removes the dependency on the profiles table existing first.
CREATE TABLE IF NOT EXISTS public.itineraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    destination TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    days INTEGER NOT NULL,
    budget TEXT,          -- 'low', 'medium', 'high'
    travel_style TEXT,    -- 'adventure', 'relaxed', 'cultural', etc.
    travelers INTEGER DEFAULT 1,
    status TEXT DEFAULT 'draft',  -- 'draft', 'published', 'archived'
    data JSONB NOT NULL,
    thread_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    itinerary_id UUID REFERENCES public.itineraries(id) ON DELETE SET NULL,
    messages JSONB NOT NULL DEFAULT '[]',
    state JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Favorite places
CREATE TABLE IF NOT EXISTS public.favorite_places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    place_id TEXT NOT NULL,
    place_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, place_id)
);

-- ─── Indexes ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_itineraries_user_id      ON public.itineraries(user_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_created_at   ON public.itineraries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id    ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_itinerary  ON public.conversations(itinerary_id);

-- ─── Row Level Security ───────────────────────────────────────────────────
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itineraries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_places  ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Itineraries
CREATE POLICY "itineraries_select" ON public.itineraries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "itineraries_insert" ON public.itineraries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "itineraries_update" ON public.itineraries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "itineraries_delete" ON public.itineraries FOR DELETE USING (auth.uid() = user_id);

-- Conversations
CREATE POLICY "conversations_select" ON public.conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "conversations_insert" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "conversations_update" ON public.conversations FOR UPDATE USING (auth.uid() = user_id);

-- Favorite places
CREATE POLICY "favorites_select" ON public.favorite_places FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites_insert" ON public.favorite_places FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_delete" ON public.favorite_places FOR DELETE USING (auth.uid() = user_id);

-- ─── Triggers updated_at ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at      ON public.profiles;
DROP TRIGGER IF EXISTS update_itineraries_updated_at   ON public.itineraries;
DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_itineraries_updated_at
    BEFORE UPDATE ON public.itineraries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Auto-create profile on signup ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
