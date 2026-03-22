-- =============================================
-- NearbyPulse Pro - Update Schema (Reviews & Edit Features)
-- 请在 Supabase Dashboard > SQL Editor 中运行此脚本
-- =============================================

-- 1. 为 merchants 表添加新的列
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS submitter_tg_id BIGINT;

-- 2. 创建评论表 (reviews)
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    tg_user_id BIGINT NOT NULL,
    tg_username TEXT,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. 创建评论点赞记录表 (review_likes)
CREATE TABLE IF NOT EXISTS review_likes (
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    tg_user_id BIGINT NOT NULL,
    PRIMARY KEY (review_id, tg_user_id)
);

-- 4. 启用 RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_likes ENABLE ROW LEVEL SECURITY;

-- 5. 配置开放访问策略 (开发环境用)
CREATE POLICY "Allow public read reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Allow public insert reviews" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update reviews" ON reviews FOR UPDATE USING (true);

CREATE POLICY "Allow public read review_likes" ON review_likes FOR SELECT USING (true);
CREATE POLICY "Allow public insert review_likes" ON review_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete review_likes" ON review_likes FOR DELETE USING (true);

CREATE POLICY "Allow public update merchants" ON merchants FOR UPDATE USING (true);
