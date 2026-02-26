-- Supabase Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: places (Map Markers)
CREATE TABLE IF NOT EXISTS places (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT,
  category_key TEXT,
  description TEXT,
  image_url TEXT,
  location_lat DOUBLE PRECISION NOT NULL,
  location_lng DOUBLE PRECISION NOT NULL,
  color TEXT,
  original_id TEXT,
  original_category_key TEXT,
  booking_url TEXT,
  linked_wp_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  opening_hours TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  sub_category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: paths (Map Saved Routes and Lines)
CREATE TABLE IF NOT EXISTS paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  category TEXT,
  category_key TEXT,
  coordinates JSONB NOT NULL, -- Array of {lat, lng} objects
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: translations (i18n Multi-language support)
CREATE TABLE IF NOT EXISTS translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  language_code TEXT NOT NULL,
  translation_key TEXT NOT NULL,
  translation_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(language_code, translation_key)
);

-- Row Level Security (RLS) Settings
-- Note: Set to allow public read, and require auth for insert/update/delete.
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all
CREATE POLICY "Allow public read access to places" ON places FOR SELECT USING (true);
CREATE POLICY "Allow public read access to paths" ON paths FOR SELECT USING (true);
CREATE POLICY "Allow public read access to translations" ON translations FOR SELECT USING (true);

-- Allow authenticated users to insert/update/delete
CREATE POLICY "Allow authenticated users full access to places" ON places AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to paths" ON paths AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access to translations" ON translations AS PERMISSIVE FOR ALL TO authenticated USING (true);
