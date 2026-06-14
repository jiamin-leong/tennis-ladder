require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

const WIN_PTS  = 4;
const DRAW_PTS = 1;
const LOSS_PTS = 1;

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Update winner_pts / loser_pts on every match
    await client.query(`
      UPDATE matches
      SET winner_pts = CASE WHEN score = 'Draw' THEN $1::int ELSE $2::int END,
          loser_pts  = CASE WHEN score = 'Draw' THEN $1::int ELSE $3::int END
    `, [DRAW_PTS, WIN_PTS, LOSS_PTS]);
    console.log('✅ Updated match point values');

    // 2. Reset all player_ladders totals to zero
    await client.query(`UPDATE player_ladders SET points = 0, wins = 0, losses = 0`);
    console.log('✅ Reset player totals');

    // 3. Recalculate from matches — winners
    await client.query(`
      UPDATE player_ladders pl
      SET points = pl.points + sub.pts,
          wins   = pl.wins   + sub.w,
          losses = pl.losses + sub.l
      FROM (
        SELECT ladder_id,
               winner_id AS player_id,
               SUM(winner_pts) AS pts,
               SUM(CASE WHEN score != 'Draw' THEN 1 ELSE 0 END) AS w,
               0 AS l
        FROM matches
        GROUP BY ladder_id, winner_id
      ) sub
      WHERE pl.ladder_id = sub.ladder_id AND pl.player_id = sub.player_id
    `);

    // 4. Recalculate from matches — losers
    await client.query(`
      UPDATE player_ladders pl
      SET points = pl.points + sub.pts,
          wins   = pl.wins   + sub.w,
          losses = pl.losses + sub.l
      FROM (
        SELECT ladder_id,
               loser_id AS player_id,
               SUM(loser_pts) AS pts,
               0 AS w,
               SUM(CASE WHEN score != 'Draw' THEN 1 ELSE 0 END) AS l
        FROM matches
        GROUP BY ladder_id, loser_id
      ) sub
      WHERE pl.ladder_id = sub.ladder_id AND pl.player_id = sub.player_id
    `);

    // Also handle doubles partners (winner_partner_id / loser_partner_id)
    await client.query(`
      UPDATE player_ladders pl
      SET points = pl.points + sub.pts,
          wins   = pl.wins   + sub.w
      FROM (
        SELECT ladder_id,
               winner_partner_id AS player_id,
               SUM(winner_pts) AS pts,
               SUM(CASE WHEN score != 'Draw' THEN 1 ELSE 0 END) AS w
        FROM matches
        WHERE winner_partner_id IS NOT NULL
        GROUP BY ladder_id, winner_partner_id
      ) sub
      WHERE pl.ladder_id = sub.ladder_id AND pl.player_id = sub.player_id
    `);

    await client.query(`
      UPDATE player_ladders pl
      SET points = pl.points + sub.pts,
          losses = pl.losses + sub.l
      FROM (
        SELECT ladder_id,
               loser_partner_id AS player_id,
               SUM(loser_pts) AS pts,
               SUM(CASE WHEN score != 'Draw' THEN 1 ELSE 0 END) AS l
        FROM matches
        WHERE loser_partner_id IS NOT NULL
        GROUP BY ladder_id, loser_partner_id
      ) sub
      WHERE pl.ladder_id = sub.ladder_id AND pl.player_id = sub.player_id
    `);

    await client.query('COMMIT');
    console.log('✅ Recalculated all player points from scratch');

    // Show summary
    const { rows } = await client.query(`
      SELECT p.name, pl.ladder_id, pl.points, pl.wins, pl.losses
      FROM player_ladders pl
      JOIN players p ON p.id = pl.player_id
      WHERE pl.status = 'approved'
      ORDER BY pl.ladder_id, pl.points DESC
    `);
    console.log('\nUpdated standings:');
    let lastLadder = null;
    for (const r of rows) {
      if (r.ladder_id !== lastLadder) { console.log(`\n  Ladder ${r.ladder_id}:`); lastLadder = r.ladder_id; }
      console.log(`    ${r.name}: ${r.points}pts (${r.wins}W / ${r.losses}L)`);
    }
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => { console.error(err); process.exit(1); });
