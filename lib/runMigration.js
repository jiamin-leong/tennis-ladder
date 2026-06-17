/**
 * Wrapper for migration scripts. Tracks applied migrations in the _migrations
 * table so each script is idempotent and the health endpoint can verify
 * the DB is up to date with the deployed code.
 *
 * Usage in a migration script:
 *   const { runMigration } = require('../lib/runMigration');
 *   runMigration('my-migration-name', async (client) => {
 *     await client.query(`ALTER TABLE ...`);
 *   });
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function runMigration(name, fn) {
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

    const { rows } = await client.query(
      'SELECT name FROM _migrations WHERE name = $1',
      [name]
    );
    if (rows.length > 0) {
      console.log(`⏭  '${name}' already applied, skipping.`);
      return;
    }

    await client.query('BEGIN');
    await fn(client);
    await client.query('INSERT INTO _migrations (name) VALUES ($1)', [name]);
    await client.query('COMMIT');
    console.log(`✅ Migration '${name}' applied.`);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(`❌ Migration '${name}' failed:`, err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

module.exports = { runMigration };
