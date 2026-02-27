-- Property Pulse Database Schema
-- Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users profile table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Criteria table
CREATE TABLE IF NOT EXISTS criteria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  property_type TEXT,
  location TEXT,
  price_min INTEGER,
  price_max INTEGER,
  beds_min INTEGER,
  baths_min INTEGER,
  keywords TEXT,
  sources TEXT[],
  min_confidence TEXT DEFAULT 'all',
  active BOOLEAN DEFAULT true,
  last_scanned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  criteria_id UUID REFERENCES criteria(id) ON DELETE CASCADE,
  property JSONB,
  match_reason TEXT,
  confidence TEXT,
  confidence_reason TEXT,
  search_strategy TEXT,
  sources_searched TEXT[],
  found_at TIMESTAMPTZ DEFAULT now(),
  notified BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own criteria" ON criteria FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own criteria" ON criteria FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own criteria" ON criteria FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own criteria" ON criteria FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own matches" ON matches FOR SELECT USING (auth.uid() = (SELECT user_id FROM criteria WHERE id = matches.criteria_id));
