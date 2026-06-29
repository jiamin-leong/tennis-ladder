import pool from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { gameId } = req.query;
    if (!gameId) return res.status(400).json({ error: 'gameId required' });
    try {
      const { rows } = await pool.query(`
        SELECT gp.*, COALESCE(p.preferred_name, p.name) AS player_name
        FROM game_participants gp
        JOIN players p ON p.id = gp.player_id
        WHERE gp.game_id = $1
        ORDER BY
          CASE gp.status WHEN 'approved' THEN 0 ELSE 1 END,
          gp.created_at ASC
      `, [gameId]);
      return res.status(200).json(rows);
    } catch (err) {
      console.error('GET /api/game-participants error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'POST') {
    const { gameId, playerId } = req.body;
    if (!gameId || !playerId) return res.status(400).json({ error: 'gameId and playerId required' });
    try {
      const { rows } = await pool.query(
        `INSERT INTO game_participants (game_id, player_id, status)
         VALUES ($1, $2, 'waitlist')
         ON CONFLICT (game_id, player_id) DO NOTHING
         RETURNING *`,
        [gameId, playerId]
      );
      return res.status(201).json(rows[0] || { game_id: gameId, player_id: playerId, status: 'waitlist' });
    } catch (err) {
      console.error('POST /api/game-participants error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'PATCH') {
    const { gameId, playerId, status, requesterId } = req.body;
    if (!gameId || !playerId || !status || !requesterId) {
      return res.status(400).json({ error: 'gameId, playerId, status, requesterId required' });
    }
    try {
      const { rows: check } = await pool.query(`SELECT creator_id FROM open_games WHERE id = $1`, [gameId]);
      if (!check.length || parseInt(check[0].creator_id) !== parseInt(requesterId)) {
        return res.status(403).json({ error: 'Only the host can manage participants' });
      }
      if (status === 'declined') {
        await pool.query(`DELETE FROM game_participants WHERE game_id = $1 AND player_id = $2`, [gameId, playerId]);
        return res.status(200).json({ ok: true });
      }
      const { rows } = await pool.query(
        `UPDATE game_participants SET status = $1 WHERE game_id = $2 AND player_id = $3 RETURNING *`,
        [status, gameId, playerId]
      );
      return res.status(200).json(rows[0]);
    } catch (err) {
      console.error('PATCH /api/game-participants error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'DELETE') {
    const { gameId, playerId } = req.body;
    if (!gameId || !playerId) return res.status(400).json({ error: 'gameId and playerId required' });
    try {
      await pool.query(`DELETE FROM game_participants WHERE game_id = $1 AND player_id = $2`, [gameId, playerId]);
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('DELETE /api/game-participants error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
