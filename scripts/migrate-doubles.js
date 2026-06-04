require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.POSTGRES_URL, ssl: { rejectUnauthorized: false } });

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running doubles migration...');
    await client.query(`ALTER TABLE ladders ADD COLUMN IF NOT EXISTS format TEXT NOT NULL DEFAULT 'singles'`);
    await client.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS winner_partner_id INT REFERENCES players(id)`);
    await client.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS loser_partner_id  INT REFERENCES players(id)`);
    console.log('✅ Doubles migration complete');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
