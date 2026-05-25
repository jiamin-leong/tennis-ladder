/**
 * Run with: node scripts/setup-db.js
 * Make sure your .env.local is set up first, or export POSTGRES_URL manually.
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
});

const schema = `
  CREATE TABLE IF NOT EXISTS ladder_settings (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'Tennis Ladder',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '90 days'),
    allow_join TEXT NOT NULL DEFAULT 'bottom',
    points_system TEXT NOT NULL DEFAULT 'standard',
    whatsapp_group TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    whatsapp_name TEXT,
    points INT NOT NULL DEFAULT 0,
    wins INT NOT NULL DEFAULT 0,
    losses INT NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    joined_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    winner_id INT NOT NULL REFERENCES players(id),
    loser_id INT NOT NULL REFERENCES players(id),
    score TEXT NOT NULL,
    sets_played INT NOT NULL DEFAULT 2,
    winner_pts INT NOT NULL,
    loser_pts INT NOT NULL,
    court TEXT,
    played_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Seed default settings if none exist
  INSERT INTO ladder_settings (name, start_date, end_date)
  SELECT 'My Tennis Ladder', CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days'
  WHERE NOT EXISTS (SELECT 1 FROM ladder_settings);
`;

async function setup() {
  const client = await pool.connect();
  try {
    console.log('🎾 Setting up Tennis Ladder database...');
    await client.query(schema);
    console.log('✅ Tables created successfully.');
  } catch (err) {
    console.error('❌ Error setting up database:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setup();
