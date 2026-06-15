/**
 * Execute SQL against Supabase to generate all lottery combinations
 * Usage: node scripts/run-sql.mjs
 */
import pkg from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const { Client } = pkg;
const __dirname = dirname(fileURLToPath(import.meta.url));

const envPath = join(__dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf-8');
const dbUrl = envContent.match(/DATABASE_URL="([^"]+)"/)?.[1];

if (!dbUrl) {
  console.error('DATABASE_URL not found in .env');
  process.exit(1);
}

const client = new Client({ connectionString: dbUrl });

async function main() {
  console.log('Connecting to Supabase...');
  await client.connect();
  console.log('Connected.');

  const sql = readFileSync(join(__dirname, '..', 'sql', 'generate_all_combinations.sql'), 'utf-8');

  // Split by numbered sections
  const sections = sql.split(/(?=--\s*\d+\.)/g).filter(s => s.trim());
  const labels = ['Drop & Create Table', 'AC Function', 'Insert All Combinations', 'Create Indexes', 'Verify Count', 'Preview'];

  for (let i = 0; i < sections.length; i++) {
    const label = labels[i] || `Section ${i + 1}`;
    const start = Date.now();

    // Extract just the SQL (skip comment lines at the start)
    const lines = sections[i].split('\n');
    const sqlLines = lines.filter(l => !l.startsWith('--')).join('\n').trim();

    if (!sqlLines) continue;

    console.log(`\n[${i + 1}/${sections.length}] ${label}...`);
    try {
      const result = await client.query(sqlLines);
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);

      if (result.command === 'SELECT') {
        if (result.rows.length === 1 && Object.keys(result.rows[0]).length === 1) {
          console.log(`  ✓ Done (${elapsed}s) - ${Object.values(result.rows[0])[0]}`);
        } else {
          console.log(`  ✓ Done (${elapsed}s) - ${result.rows.length} rows`);
          if (result.rows.length <= 10) {
            console.table(result.rows);
          }
        }
      } else {
        console.log(`  ✓ Done (${elapsed}s) - ${result.command} ${result.rowCount || ''}`);
      }
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}`);
    }
  }

  await client.end();
  console.log('\n✅ All done!');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
