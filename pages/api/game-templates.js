import pool from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { playerId } = req.query;
    if (!playerId) return res.status(400).json({ error: 'playerId required' });
    try {
      const { rows } = await pool.query(
        `SELECT * FROM game_templates WHERE player_id = $1 ORDER BY created_at DESC`,
        [playerId]
      );
      return res.status(200).json(rows);
    } catch (err) {
      console.error('GET /api/game-templates error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'POST') {
    const { playerId, name, title, time, location, description } = req.body;
    if (!playerId || !name?.trim()) return res.status(400).json({ error: 'playerId and name required' });
    try {
      const { rows } = await pool.query(
        `INSERT INTO game_templates (player_id, name, title, time, location, description)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [playerId, name.trim(), title?.trim() || null, time || null, location?.trim() || null, description?.trim() || null]
      );
      return res.status(201).json(rows[0]);
    } catch (err) {
      console.error('POST /api/game-templates error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'DELETE') {
    const { id, playerId } = req.body;
    if (!id || !playerId) return res.status(400).json({ error: 'id and playerId required' });
    try {
      await pool.query(`DELETE FROM game_templates WHERE id = $1 AND player_id = $2`, [id, playerId]);
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('DELETE /api/game-templates error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
