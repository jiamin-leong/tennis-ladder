import pool from '../../lib/db';
import { verifyCreator } from '../../lib/verifyCreator';

// Generates bracket slot order so seed 1 and 2 can only meet in the final
function bracketOrder(n) {
  if (n === 1) return [1];
  const half = bracketOrder(n / 2);
  return half.flatMap(s => [s, n + 1 - s]);
}

const WITH_NAMES = `
  SELECT pm.*,
    COALESCE(p1.preferred_name, p1.name) AS player1_name,
    COALESCE(p2.preferred_name, p2.name) AS player2_name,
    COALESCE(pw.preferred_name, pw.name) AS winner_name
  FROM playoff_matches pm
  LEFT JOIN players p1 ON pm.player1_id = p1.id
  LEFT JOIN players p2 ON pm.player2_id = p2.id
  LEFT JOIN players pw ON pm.winner_id   = pw.id
`;

export default async function handler(req, res) {

  // ── GET ──────────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { ladderId } = req.query;
    if (!ladderId) return res.status(400).json({ error: 'ladderId required' });
    try {
      const { rows: playoffs } = await pool.query(
        `SELECT * FROM playoffs WHERE ladder_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [ladderId]
      );
      if (playoffs.length === 0) return res.status(200).json(null);
      const playoff = playoffs[0];
      const { rows: matches } = await pool.query(
        WITH_NAMES + `WHERE pm.playoff_id = $1 ORDER BY pm.round, pm.match_number`,
        [playoff.id]
      );
      return res.status(200).json({ ...playoff, matches });
    } catch (err) {
      console.error('GET /api/playoffs error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // ── POST — generate bracket ──────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { ladderId, topN, requesterId } = req.body;
    const n = Number(topN);
    if (!ladderId || !n) return res.status(400).json({ error: 'ladderId and topN required' });
    if (![4, 8, 16].includes(n)) return res.status(400).json({ error: 'topN must be 4, 8, or 16' });

    const isCreator = await verifyCreator(ladderId, requesterId);
    if (!isCreator) return res.status(403).json({ error: 'Not authorised' });

    const client = await pool.connect();
    try {
      const { rows: existing } = await client.query(
        `SELECT id FROM playoffs WHERE ladder_id = $1 AND status = 'active'`,
        [ladderId]
      );
      if (existing.length > 0) return res.status(409).json({ error: 'Active playoff already exists for this ladder' });

      const { rows: topPlayers } = await client.query(
        `SELECT player_id FROM player_ladders
         WHERE ladder_id = $1 AND status = 'approved'
         ORDER BY points DESC, player_id ASC LIMIT $2`,
        [ladderId, n]
      );
      if (topPlayers.length < n) {
        return res.status(400).json({ error: `Need ${n} approved players, only ${topPlayers.length} available` });
      }

      await client.query('BEGIN');

      const { rows: [playoff] } = await client.query(
        `INSERT INTO playoffs (ladder_id, player_count) VALUES ($1, $2) RETURNING *`,
        [ladderId, n]
      );

      // Seed by rank: position i in bracketOrder gets seed i+1 → that player
      const order = bracketOrder(n);
      const playerBySeed = {};
      topPlayers.forEach((p, i) => { playerBySeed[i + 1] = p.player_id; });
      const totalRounds = Math.log2(n);

      // Round 1 — seeded matchups
      for (let i = 0; i < n / 2; i++) {
        const s1 = order[i * 2];
        const s2 = order[i * 2 + 1];
        await client.query(
          `INSERT INTO playoff_matches (playoff_id, round, match_number, player1_id, player2_id, player1_seed, player2_seed)
           VALUES ($1, 1, $2, $3, $4, $5, $6)`,
          [playoff.id, i + 1, playerBySeed[s1], playerBySeed[s2], s1, s2]
        );
      }

      // Future rounds — empty placeholders
      for (let r = 2; r <= totalRounds; r++) {
        const count = n / Math.pow(2, r);
        for (let m = 1; m <= count; m++) {
          await client.query(
            `INSERT INTO playoff_matches (playoff_id, round, match_number) VALUES ($1, $2, $3)`,
            [playoff.id, r, m]
          );
        }
      }

      await client.query('COMMIT');

      const { rows: matches } = await pool.query(
        WITH_NAMES + `WHERE pm.playoff_id = $1 ORDER BY pm.round, pm.match_number`,
        [playoff.id]
      );
      return res.status(201).json({ ...playoff, matches });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('POST /api/playoffs error:', err);
      return res.status(500).json({ error: 'Failed to create playoff' });
    } finally {
      client.release();
    }
  }

  // ── PUT — record match result ────────────────────────────────────────────────
  if (req.method === 'PUT') {
    const { matchId, winnerId, score, playedAt, requesterId } = req.body;
    if (!matchId || !winnerId) return res.status(400).json({ error: 'matchId and winnerId required' });

    const client = await pool.connect();
    try {
      const { rows } = await client.query(
        `SELECT pm.*, po.player_count, po.ladder_id
         FROM playoff_matches pm JOIN playoffs po ON pm.playoff_id = po.id
         WHERE pm.id = $1`,
        [matchId]
      );
      if (rows.length === 0) return res.status(404).json({ error: 'Match not found' });
      const match = rows[0];

      if (Number(winnerId) !== match.player1_id && Number(winnerId) !== match.player2_id) {
        return res.status(400).json({ error: 'Winner must be one of the two players' });
      }

      const isCreator = await verifyCreator(match.ladder_id, requesterId);
      if (!isCreator) return res.status(403).json({ error: 'Not authorised' });

      const totalRounds = Math.log2(match.player_count);
      const winnerSeed = Number(winnerId) === match.player1_id ? match.player1_seed : match.player2_seed;

      await client.query('BEGIN');

      await client.query(
        `UPDATE playoff_matches SET winner_id = $1, score = $2, played_at = $3 WHERE id = $4`,
        [winnerId, score?.trim() || null, playedAt ? new Date(playedAt) : new Date(), matchId]
      );

      if (match.round < totalRounds) {
        // Advance winner to next round
        const nextRound  = match.round + 1;
        const nextMatch  = Math.ceil(match.match_number / 2);
        const slot       = match.match_number % 2 === 1 ? 'player1' : 'player2';
        await client.query(
          `UPDATE playoff_matches
           SET ${slot}_id = $1, ${slot}_seed = $2
           WHERE playoff_id = $3 AND round = $4 AND match_number = $5`,
          [winnerId, winnerSeed, match.playoff_id, nextRound, nextMatch]
        );
      } else {
        // Final complete — mark playoff done
        await client.query(`UPDATE playoffs SET status = 'completed' WHERE id = $1`, [match.playoff_id]);
      }

      await client.query('COMMIT');

      const { rows: matches } = await pool.query(
        WITH_NAMES + `WHERE pm.playoff_id = $1 ORDER BY pm.round, pm.match_number`,
        [match.playoff_id]
      );
      const { rows: [updated] } = await pool.query(`SELECT * FROM playoffs WHERE id = $1`, [match.playoff_id]);
      return res.status(200).json({ ...updated, matches });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('PUT /api/playoffs error:', err);
      return res.status(500).json({ error: 'Failed to record result' });
    } finally {
      client.release();
    }
  }

  // ── DELETE — reset playoff ───────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const { playoffId, requesterId } = req.body;
    if (!playoffId) return res.status(400).json({ error: 'playoffId required' });

    const { rows } = await pool.query(`SELECT ladder_id FROM playoffs WHERE id = $1`, [playoffId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Playoff not found' });

    const isCreator = await verifyCreator(rows[0].ladder_id, requesterId);
    if (!isCreator) return res.status(403).json({ error: 'Not authorised' });

    await pool.query(`DELETE FROM playoffs WHERE id = $1`, [playoffId]);
    return res.status(200).json({ deleted: playoffId });
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ error: 'Method not allowed' });
}
