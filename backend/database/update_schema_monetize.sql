-- =============================================
-- NearbyPulse Pro - Update Schema (Monetization & Deals)
-- 请在 Supabase Dashboard > SQL Editor 中运行此脚本
-- =============================================

-- 1. 为 merchants 表添加商业化相关的列
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS is_sponsored BOOLEAN DEFAULT false;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS deal_title TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS deal_points INTEGER DEFAULT 0;

-- 2. 创建用户积分核销换券记录表 (可选，用于对账)
CREATE TABLE IF NOT EXISTS user_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tg_user_id BIGINT NOT NULL,
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    deal_title TEXT NOT NULL,
    cost INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. 启用 RLS
ALTER TABLE user_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all user_deals" ON user_deals FOR ALL USING (true);
