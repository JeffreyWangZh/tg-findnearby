-- 添加 deals JSONB 列到 merchants 表
-- 用于支持多个营销福利活动同时发布
-- 每个 deal 结构: { title: string, points: number, quantity: number }
-- quantity = 0 表示不限量

ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS deals JSONB DEFAULT '[]'::jsonb;

-- 将已有的 deal_title/deal_points 数据迁移到 deals 数组
UPDATE merchants 
SET deals = jsonb_build_array(
  jsonb_build_object(
    'title', deal_title, 
    'points', COALESCE(deal_points, 0), 
    'quantity', 0
  )
)
WHERE deal_title IS NOT NULL 
  AND deal_title != '' 
  AND (deals IS NULL OR deals = '[]'::jsonb);
