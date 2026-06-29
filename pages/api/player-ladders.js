import pool from '../../lib/db';
import { verifyCreator } from '../../lib/verifyCreator';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { ladderId, playerId } = req.query;
    if (!ladderId) return res.status(400).json({ error: 'ladderId required' });
    try {
      let query, params;
      if (playerId) {
        query = `
          SELECT pl.*, COALESCE(p.preferred_name, p.name) AS name, p.phone, p.gender
          FROM player_ladders pl
          JOIN players p ON p.id = pl.player_id
          WHERE pl.ladder_id = $1 AND pl.player_id = $2
        `;
        params = [ladderId, playerId];
      } else {
        query = `
          SELECT pl.*, COALESCE(p.preferred_name, p.name) AS name, p.phone, p.gender,
                 p.preferred_name, p.preferred_locations
          FROM player_ladders pl
          JOIN players p ON p.id = pl.player_id
          WHERE pl.ladder_id = $1
          ORDER BY
            CASE pl.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
            pl.points DESC
        `;
        params = [ladderId];
      }
      const { rows } = await pool.query(query, params);
      return res.status(200).json(rows);
    } catch (err) {
      console.error('GET /api/player-ladders error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'POST') {
    const { playerId, ladderId, requesterId } = req.body;
    if (!playerId || !ladderId) return res.status(400).json({ error: 'playerId and ladderId required' });
    try {
      // Auto-approve if the joiner is the organiser
      const isOrganiser = requesterId && await verifyCreator(ladderId, requesterId);
      const status = (isOrganiser && parseInt(requesterId) === parseInt(playerId)) ? 'approved' : 'pending';
      const { rows } = await pool.query(
        `INSERT INTO player_ladders (player_id, ladder_id, status)
         VALUES ($1, $2, $3)
         ON CONFLICT (player_id, ladder_id) DO NOTHING
         RETURNING *`,
        [playerId, ladderId, status]
      );
      return res.status(201).json(rows[0] || { player_id: playerId, ladder_id: ladderId, status });
    } catch (err) {
      console.error('POST /api/player-ladders error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'DELETE') {
    const { playerId, ladderId, requesterId } = req.body;
    if (!playerId || !ladderId || !requesterId) return res.status(400).json({ error: 'playerId, ladderId, requesterId required' });
    if (parseInt(playerId) !== parseInt(requesterId)) return res.status(403).json({ error: 'Can only remove yourself' });
    const isOrganiser = await verifyCreator(ladderId, requesterId);
    if (!isOrganiser) return res.status(403).json({ error: 'Not authorised' });
    try {
      await pool.query(`DELETE FROM player_ladders WHERE player_id=$1 AND ladder_id=$2`, [playerId, ladderId]);
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('DELETE /api/player-ladders error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'PATCH') {
    const { playerId, ladderId, status, requesterId } = req.body;
    if (!playerId || !ladderId || !status) return res.status(400).json({ error: 'playerId, ladderId, status required' });
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const isCreator = await verifyCreator(ladderId, requesterId);
    if (!isCreator) return res.status(403).json({ error: 'Not authorised' });
    try {
      const { rows } = await pool.query(
        `UPDATE player_ladders SET status=$1 WHERE player_id=$2 AND ladder_id=$3 RETURNING *`,
        [status, playerId, ladderId]
      );
      if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(rows[0]);
    } catch (err) {
      console.error('PATCH /api/player-ladders error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PATCH']);
  return res.status(405).json({ error: 'Method not allowed' });
}
