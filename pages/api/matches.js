import pool from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { playerId } = req.query;
    try {
      const base = `
        SELECT
          m.id,
          m.score,
          m.winner_pts,
          m.loser_pts,
          m.court,
          m.played_at,
          w.id   AS winner_id,
          COALESCE(w.preferred_name, w.name) AS winner_name,
          l.id   AS loser_id,
          COALESCE(l.preferred_name, l.name) AS loser_name
        FROM matches m
        JOIN players w ON m.winner_id = w.id
        JOIN players l ON m.loser_id  = l.id`;

      const { rows } = playerId
        ? await pool.query(
            base + ` WHERE w.id = $1 OR l.id = $1 ORDER BY m.played_at DESC LIMIT 100`,
            [playerId]
          )
        : await pool.query(base + ` ORDER BY m.played_at DESC LIMIT 50`);

      return res.status(200).json(rows);
    } catch (err) {
      console.error('GET /api/matches error:', err);
      return res.status(500).json({ error: 'Failed to fetch matches' });
    }
  }

  if (req.method === 'POST') {
    const { p1Id, p2Id, winnerId, score, court, playedAt } = req.body;

    if (!p1Id || !p2Id || !winnerId) {
      return res.status(400).json({ error: 'p1Id, p2Id and winnerId are required' });
    }
    if (p1Id === p2Id) {
      return res.status(400).json({ error: 'Players must be different' });
    }
    const isDraw = winnerId === 'draw';
    if (!isDraw && winnerId !== p1Id && winnerId !== p2Id) {
      return res.status(400).json({ error: 'winnerId must be one of the two players or "draw"' });
    }

    const settingsRes = await pool.query(
      'SELECT win_pts, loss_pts, draw_pts FROM ladder_settings ORDER BY id LIMIT 1'
    );
    const { win_pts = 3, loss_pts = 0, draw_pts = 1 } = settingsRes.rows[0] || {};

    const resolvedWinnerId = isDraw ? p1Id : winnerId;
    const resolvedLoserId  = isDraw ? p2Id : (winnerId === p1Id ? p2Id : p1Id);
    const winnerPts = isDraw ? draw_pts : win_pts;
    const loserPts  = isDraw ? draw_pts : loss_pts;
    const scoreStr  = score?.trim() || (isDraw ? 'Draw' : '—');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `INSERT INTO matches (winner_id, loser_id, score, sets_played, winner_pts, loser_pts, court, played_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          resolvedWinnerId,
          resolvedLoserId,
          scoreStr,
          0,
          winnerPts,
          loserPts,
          court?.trim() || null,
          playedAt ? new Date(playedAt) : new Date(),
        ]
      );

      if (isDraw) {
        await client.query(
          `UPDATE players SET points = points + $1 WHERE id IN ($2, $3)`,
          [draw_pts, p1Id, p2Id]
        );
      } else {
        await client.query(
          `UPDATE players SET points = points + $1, wins = wins + 1 WHERE id = $2`,
          [win_pts, resolvedWinnerId]
        );
        await client.query(
          `UPDATE players SET points = points + $1, losses = losses + 1 WHERE id = $2`,
          [loss_pts, resolvedLoserId]
        );
      }

      await client.query('COMMIT');

      return res.status(201).json({
        matchId: rows[0].id,
        winnerId: resolvedWinnerId,
        loserId: resolvedLoserId,
        winnerPts,
        loserPts,
        isDraw,
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
