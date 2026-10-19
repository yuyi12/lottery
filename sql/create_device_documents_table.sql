-- 创建设备文档表（在 Supabase SQL Editor 中执行）
-- 说明：本地直连 db.<ref>.supabase.co 常因代理/仅 IPv6 记录导致无法连接，
-- 可在 Supabase 控制台 → SQL Editor 粘贴执行本文件。
CREATE TABLE IF NOT EXISTS device_documents (
  id BIGSERIAL PRIMARY KEY,
  device_model_id BIGINT NOT NULL REFERENCES device_models(id) ON DELETE CASCADE,
  description TEXT,
  doc_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_documents_device_model_id
  ON device_documents(device_model_id);
