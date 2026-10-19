-- 创建笔记表（在 Supabase SQL Editor 中执行）
-- 说明：本地直连 db.<ref>.supabase.co 常因代理/仅 IPv6 记录导致无法连接，
-- 可在 Supabase 控制台 → SQL Editor 粘贴执行本文件。
CREATE TABLE IF NOT EXISTS notes (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  device_model_id BIGINT REFERENCES device_models(id) ON DELETE SET NULL,
  content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
