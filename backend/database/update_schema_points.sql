-- =============================================
-- NearbyPulse Pro - Update Schema (Points System)
-- 请在 Supabase Dashboard > SQL Editor 中运行此脚本
-- =============================================

-- 创建积分记录表
CREATE TABLE IF NOT EXISTS points_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tg_user_id BIGINT NOT NULL,
    action TEXT NOT NULL,
    points INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 启用 RLS 安全策略并设置全公开 (方便当前开发测试)
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read points_history" ON points_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert points_history" ON points_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update points_history" ON points_history FOR UPDATE USING (true);
CREATE POLICY "Allow public delete points_history" ON points_history FOR DELETE USING (true);
