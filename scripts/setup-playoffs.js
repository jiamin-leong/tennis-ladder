require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS playoffs (
        id          SERIAL PRIMARY KEY,
        ladder_id   INT  NOT NULL REFERENCES ladders(id),
        player_count INT NOT NULL,
        status      TEXT NOT NULL DEFAULT 'active',
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS playoff_matches (
        id            SERIAL PRIMARY KEY,
        playoff_id    INT  NOT NULL REFERENCES playoffs(id) ON DELETE CASCADE,
        round         INT  NOT NULL,
        match_number  INT  NOT NULL,
        player1_id    INT  REFERENCES players(id),
        player2_id    INT  REFERENCES players(id),
        player1_seed  INT,
        player2_seed  INT,
        winner_id     INT  REFERENCES players(id),
        score         TEXT,
        played_at     DATE
      )
    `);

    await client.query('COMMIT');
    console.log('Playoff tables created successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
