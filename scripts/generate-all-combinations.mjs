/**
 * 通过 Node.js 连接 Supabase 生成双色球全组合
 * 用法: node scripts/generate-all-combinations.mjs
 */
import { createPool } from '@vercel/postgres';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// 读取 .env
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf-8');
const dbUrl = envContent.match(/DATABASE_URL="([^"]+)"/)?.[1];

if (!dbUrl) {
  console.error('DATABASE_URL not found in .env');
  process.exit(1);
}

const pool = createPool({ connectionString: dbUrl });

async function main() {
  console.log('Connecting to Supabase...');

  // 读取 SQL 文件
  const sql = readFileSync(join(__dirname, '..', 'sql', 'generate_all_combinations.sql'), 'utf-8');

  // 分步执行（跳过建表如果已存在）
  const steps = sql
    .split(/--\s*\d+\./g)
    .filter(s => s.trim());

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i].trim();
    const label = step.split('\n')[0].replace(/^[-=\s]+/, '').trim() || `Step ${i + 1}`;
    console.log(`\n[${i + 1}/${steps.length}] ${label}...`);

    try {
      const start = Date.now();
      const result = await pool.query(step);
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      const info = result.command === 'SELECT'
        ? `${result.rows?.length || result.rowCount} rows`
        : result.command;
      console.log(`  ✓ Done (${elapsed}s) - ${info}`);
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}`);
      // Don't exit on first error - table might already exist
    }
  }

  console.log('\n✅ Complete!');
  await pool.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
