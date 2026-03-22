-- =============================================
-- NearbyPulse Pro - Supabase Database Schema
-- 请在 Supabase Dashboard > SQL Editor 中运行
-- https://supabase.com/dashboard/project/fodnvjwsgkqousdgndaq/sql/new
-- =============================================

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tg_id BIGINT UNIQUE NOT NULL,
    username TEXT,
    full_name TEXT,
    contribution_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Merchants table
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    physical_address TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    owner_tg_id TEXT,
    media_urls JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Training Materials table
CREATE TABLE IF NOT EXISTS training_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT CHECK (content_type IN ('article', 'video')),
    url TEXT NOT NULL,
    category TEXT CHECK (category IN ('Beginner', 'Marketing', 'Operations')),
    thumbnail_url TEXT,
    duration TEXT,
    rating NUMERIC(2,1) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. User Bookmarks
CREATE TABLE IF NOT EXISTS user_bookmarks (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    material_id UUID REFERENCES training_materials(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, material_id)
);

-- 5. Enable Row Level Security
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
CREATE POLICY "Allow public read merchants" ON merchants FOR SELECT USING (true);
CREATE POLICY "Allow public insert merchants" ON merchants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read training" ON training_materials FOR SELECT USING (true);
CREATE POLICY "Allow public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read bookmarks" ON user_bookmarks FOR SELECT USING (true);
CREATE POLICY "Allow public insert bookmarks" ON user_bookmarks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete bookmarks" ON user_bookmarks FOR DELETE USING (true);

-- 7. Seed training materials
INSERT INTO training_materials (title, description, content_type, url, category, thumbnail_url, duration, rating) VALUES
('Mastering Telegram Mini Apps', 'Learn the basics of building and launching your Mini App inside Telegram.', 'video', 'https://example.com/video1', 'Beginner', 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=300&h=200&fit=crop', '12 min', 4.8),
('Skyrocket Sales with Local SEO', 'Drive more local traffic and customers to your business with proven SEO tactics.', 'article', 'https://example.com/article1', 'Marketing', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=300&h=200&fit=crop', '8 min read', 4.9),
('Managing Inventory on TG Bot', 'Streamline your business operations with an automated Telegram bot for stock management.', 'video', 'https://example.com/video2', 'Operations', 'https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=300&h=200&fit=crop', '15 min', 4.7),
('Setting Up Your TG Shop Bot', 'Step-by-step guide to creating your first Telegram shop bot from scratch.', 'video', 'https://example.com/video3', 'Beginner', 'https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=300&h=200&fit=crop', '20 min', 4.6),
('Social Media Ads for Local Biz', 'How to run effective paid ad campaigns targeting your local audience.', 'article', 'https://example.com/article2', 'Marketing', 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?q=80&w=300&h=200&fit=crop', '10 min read', 4.5),
('Automating Customer Support', 'Use Telegram bots for 24/7 automated customer service and FAQ responses.', 'article', 'https://example.com/article3', 'Operations', 'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=300&h=200&fit=crop', '6 min read', 4.8);
