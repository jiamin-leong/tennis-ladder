require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.POSTGRES_URL, ssl: { rejectUnauthorized: false } });

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running multi-ladder migration...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS ladders (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL DEFAULT 'Tennis Ladder',
        start_date DATE NOT NULL DEFAULT CURRENT_DATE,
        end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '90 days'),
        allow_join TEXT NOT NULL DEFAULT 'bottom',
        win_pts INT NOT NULL DEFAULT 3,
        loss_pts INT NOT NULL DEFAULT 0,
        draw_pts INT NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Migrate existing ladder_settings into ladders
    await client.query(`
      INSERT INTO ladders (name, start_date, end_date, allow_join, win_pts, loss_pts, draw_pts, created_at, updated_at)
      SELECT name, start_date, end_date, allow_join,
        COALESCE(win_pts, 3), COALESCE(loss_pts, 0), COALESCE(draw_pts, 1),
        created_at, updated_at
      FROM ladder_settings ORDER BY id LIMIT 1
      ON CONFLICT DO NOTHING
    `);

    const { rows: count } = await client.query('SELECT COUNT(*) FROM ladders');
    if (parseInt(count[0].count) === 0) {
      await client.query(`INSERT INTO ladders (name, start_date, end_date) VALUES ('Tennis Ladder', CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days')`);
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS player_ladders (
        id SERIAL PRIMARY KEY,
        player_id INT REFERENCES players(id) ON DELETE CASCADE,
        ladder_id INT REFERENCES ladders(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'pending',
        points INT NOT NULL DEFAULT 0,
        wins INT NOT NULL DEFAULT 0,
        losses INT NOT NULL DEFAULT 0,
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(player_id, ladder_id)
      )
    `);

    // Migrate existing players into ladder 1 with their current stats
    await client.query(`
      INSERT INTO player_ladders (player_id, ladder_id, status, points, wins, losses)
      SELECT id, 1, status, points, wins, losses
      FROM players WHERE active = TRUE
      ON CONFLICT (player_id, ladder_id) DO NOTHING
    `);

    await client.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS ladder_id INT REFERENCES ladders(id)`);
    await client.query(`UPDATE matches SET ladder_id = 1 WHERE ladder_id IS NULL`);

    console.log('✅ Multi-ladder migration complete');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
