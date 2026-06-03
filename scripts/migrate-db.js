require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running migrations...');
    await client.query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved'`);
    await client.query(`ALTER TABLE ladder_settings ADD COLUMN IF NOT EXISTS win_pts INT NOT NULL DEFAULT 3`);
    await client.query(`ALTER TABLE ladder_settings ADD COLUMN IF NOT EXISTS loss_pts INT NOT NULL DEFAULT 0`);
    await client.query(`ALTER TABLE ladder_settings ADD COLUMN IF NOT EXISTS draw_pts INT NOT NULL DEFAULT 1`);
    console.log('✅ Migration complete');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
