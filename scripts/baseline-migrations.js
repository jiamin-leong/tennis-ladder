/**
 * Run once on any existing DB (staging or prod) to mark all pre-existing
 * migrations as applied. This bootstraps the _migrations tracking table
 * without re-running scripts that have already been executed.
 *
 * Run with: node scripts/baseline-migrations.js
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const EXISTING_MIGRATIONS = [
  'setup-db',
  'migrate-db',
  'migrate-multi-tenant',
  'migrate-multi-ladder',
  'migrate-doubles',
  'migrate-phones',
  'migrate-add-pin',
];

async function baseline() {
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
  });
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    for (const name of EXISTING_MIGRATIONS) {
      await client.query(
        `INSERT INTO _migrations (name) VALUES ($1) ON CONFLICT DO NOTHING`,
        [name]
      );
      console.log(`✓ ${name}`);
    }
    console.log('\n✅ All migrations baselined.');
  } catch (err) {
    console.error('❌ Baseline failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

baseline();
