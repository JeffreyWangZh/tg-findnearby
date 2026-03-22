-- ============================================================
-- 创建 merchant-media 公共存储桶
-- 在 Supabase Dashboard -> SQL Editor 中执行此脚本
-- ============================================================

-- 1. 创建公共存储桶 (允许公开读取)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'merchant-media', 
  'merchant-media', 
  true,                          -- 公开 (anyone can read via public URL)
  20971520,                      -- 20MB 限制
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- 2. 允许所有用户(包括匿名) upload 文件
-- (这里不做严格的身份验证，因为 TG Mini App 使用 anon key)
CREATE POLICY "Allow public upload" ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'merchant-media');

-- 3. 允许所有用户读取/下载文件  
CREATE POLICY "Allow public read" ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'merchant-media');

-- 4. 允许更新和删除自己上传的文件 (可选)
CREATE POLICY "Allow public update" ON storage.objects
  FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'merchant-media');

CREATE POLICY "Allow public delete" ON storage.objects
  FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'merchant-media');
