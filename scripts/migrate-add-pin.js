require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS pin_hash TEXT`);
    console.log('✅ Added pin_hash column to players table');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => { console.error(err); process.exit(1); });
