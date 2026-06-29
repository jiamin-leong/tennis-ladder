import pool from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { gameId } = req.query;
    if (!gameId) return res.status(400).json({ error: 'gameId required' });
    try {
      const { rows } = await pool.query(
        `SELECT gm.id, gm.game_id, gm.player_id, gm.message, gm.created_at,
           COALESCE(p.preferred_name, p.name) AS player_name
         FROM game_messages gm
         JOIN players p ON p.id = gm.player_id
         WHERE gm.game_id = $1
         ORDER BY gm.created_at ASC`,
        [gameId]
      );
      return res.status(200).json(rows);
    } catch (err) {
      console.error('GET /api/game-messages error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'POST') {
    const { gameId, playerId, message } = req.body;
    if (!gameId || !playerId || !message?.trim()) {
      return res.status(400).json({ error: 'gameId, playerId, message required' });
    }
    try {
      const { rows } = await pool.query(
        `INSERT INTO game_messages (game_id, player_id, message)
         VALUES ($1, $2, $3)
         RETURNING id, game_id, player_id, message, created_at`,
        [gameId, playerId, message.trim()]
      );
      return res.status(201).json(rows[0]);
    } catch (err) {
      console.error('POST /api/game-messages error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
