/**
 * Create the device_documents table in Supabase (idempotent).
 * Usage: node scripts/create-device-documents-table.mjs
 *
 * 说明：使用 .env 里的 DIRECT_URL 直连（db.<ref>.supabase.co:5432）。
 * 若本机开启了代理/VPN，该域名可能被剥掉 IPv4 记录导致连不上，
 * 请先关闭代理再运行，或改用 Supabase SQL Editor 手动执行 sql/create_device_documents_table.sql。
 */
import pkg from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const { Client } = pkg;
const __dirname = dirname(fileURLToPath(import.meta.url));

const env = readFileSync(join(__dirname, '..', '.env'), 'utf-8');
const url = env.match(/DIRECT_URL="([^"]+)"/)?.[1];

if (!url) {
  console.error('DIRECT_URL not found in .env');
  process.exit(1);
}

const client = new Client({ connectionString: url });

async function main() {
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS device_documents (
      id BIGSERIAL PRIMARY KEY,
      device_model_id BIGINT NOT NULL REFERENCES device_models(id) ON DELETE CASCADE,
      description TEXT,
      doc_path TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_device_documents_device_model_id
      ON device_documents(device_model_id);
  `);
  const { rows } = await client.query(`SELECT to_regclass('public.device_documents') AS t`);
  console.log('✅ device_documents table ready:', rows[0].t);
  await client.end();
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
