import pool from '../../lib/db';
import { calculateMatch } from '../../lib/utils';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { rows } = await pool.query(
        `SELECT
           m.id,
           m.score,
           m.sets_played,
           m.winner_pts,
           m.loser_pts,
           m.court,
           m.played_at,
           w.id   AS winner_id,
           w.name AS winner_name,
           l.id   AS loser_id,
           l.name AS loser_name
         FROM matches m
         JOIN players w ON m.winner_id = w.id
         JOIN players l ON m.loser_id  = l.id
         ORDER BY m.played_at DESC
         LIMIT 50`
      );
      return res.status(200).json(rows);
    } catch (err) {
      console.error('GET /api/matches error:', err);
      return res.status(500).json({ error: 'Failed to fetch matches' });
    }
  }

  if (req.method === 'POST') {
    const { p1Id, p2Id, sets, court, playedAt } = req.body;

    if (!p1Id || !p2Id || !sets?.length) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (p1Id === p2Id) {
      return res.status(400).json({ error: 'Players must be different' });
    }

    const { winnerId, loserId, winnerPts, loserPts, scoreString, setsPlayed } =
      calculateMatch({ p1Id, p2Id, sets });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert match record
      const { rows } = await client.query(
        `INSERT INTO matches
           (winner_id, loser_id, score, sets_played, winner_pts, loser_pts, court, played_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          winnerId,
          loserId,
          scoreString,
          setsPlayed,
          winnerPts,
          loserPts,
          court?.trim() || null,
          playedAt ? new Date(playedAt) : new Date(),
        ]
      );

      // Update winner stats
      await client.query(
        `UPDATE players
         SET points = points + $1, wins = wins + 1
         WHERE id = $2`,
        [winnerPts, winnerId]
      );

      // Update loser stats
      await client.query(
        `UPDATE players
         SET points = points + $1, losses = losses + 1
         WHERE id = $2`,
        [loserPts, loserId]
      );

      await client.query('COMMIT');

      return res.status(201).json({
        matchId: rows[0].id,
        winnerId,
        loserId,
        winnerPts,
        loserPts,
        scoreString,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('POST /api/matches error:', err);
      return res.status(500).json({ error: 'Failed to submit match' });
    } finally {
      client.release();
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
