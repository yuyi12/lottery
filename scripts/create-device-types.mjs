/**
 * Create the device_types table in Supabase (idempotent).
 * Usage: node scripts/create-device-types.mjs
 *
 * 说明：使用 .env 里的 DIRECT_URL 直连（db.<ref>.supabase.co:5432）。
 * 若本机开启了代理/VPN，该域名可能被剥掉 IPv4 记录导致连不上，
 * 请先关闭代理再运行，或改用 Supabase SQL Editor 手动执行同样的建表语句。
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
    CREATE TABLE IF NOT EXISTS device_types (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  const { rows } = await client.query(`SELECT to_regclass('public.device_types') AS t`);
  console.log('✅ device_types table ready:', rows[0].t);
  await client.end();
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
