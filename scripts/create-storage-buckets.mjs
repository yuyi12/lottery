/**
 * Create public storage buckets (idempotent) via Supabase Storage API (HTTPS).
 * Usage: node scripts/create-storage-buckets.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(join(__dirname, '..', '.env'), 'utf-8');

const url = env.match(/NEXT_PUBLIC_SUPABASE_URL="([^"]+)"/)?.[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY="([^"]+)"/)?.[1];

if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not found in .env');
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false } });

const BUCKETS = ['brand-logos', 'device-model-images'];

async function main() {
  const { data: buckets, error: listErr } = await admin.storage.listBuckets();
  if (listErr) throw listErr;

  const names = new Set((buckets || []).map((b) => b.name));
  for (const name of BUCKETS) {
    if (names.has(name)) {
      console.log(`✅ bucket ${name} already exists`);
    } else {
      const { error } = await admin.storage.createBucket(name, { public: true });
      if (error) throw error;
      console.log(`✅ bucket ${name} created (public)`);
    }
  }
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
