import pool from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { status, ladderId } = req.query;
    try {
      let rows;
      if (ladderId) {
        // Return players with ladder-specific stats
        ({ rows } = await pool.query(
          status === 'all'
            ? `SELECT p.id, COALESCE(p.preferred_name, p.name) AS name, p.preferred_name,
                 p.gender, p.preferred_locations, p.joined_at,
                 pl.points, pl.wins, pl.losses, pl.status, pl.joined_at AS ladder_joined_at
               FROM player_ladders pl
               JOIN players p ON p.id = pl.player_id
               WHERE pl.ladder_id = $1 AND p.active = TRUE
               ORDER BY
                 CASE pl.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
                 pl.points DESC, pl.wins DESC`
            : `SELECT p.id, COALESCE(p.preferred_name, p.name) AS name, p.preferred_name,
                 p.gender, p.preferred_locations, p.joined_at,
                 pl.points, pl.wins, pl.losses, pl.status
               FROM player_ladders pl
               JOIN players p ON p.id = pl.player_id
               WHERE pl.ladder_id = $1 AND pl.status = 'approved' AND p.active = TRUE
               ORDER BY pl.points DESC, pl.wins DESC`,
          [ladderId]
        ));
      } else {
        // Legacy: return all active players (for dropdowns, admin player list without ladder context)
        ({ rows } = await pool.query(
          status === 'all'
            ? `SELECT id, name, preferred_name, points, wins, losses, status, gender, preferred_locations, joined_at
               FROM players WHERE active = TRUE
               ORDER BY
                 CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
                 points DESC, wins DESC, joined_at ASC`
            : `SELECT id, name, preferred_name, points, wins, losses, status, joined_at
               FROM players WHERE active = TRUE AND status = 'approved'
               ORDER BY points DESC, wins DESC, joined_at ASC`
        ));
      }
      return res.status(200).json(rows);
    } catch (err) {
      console.error('GET /api/players error:', err);
      return res.status(500).json({ error: 'Failed to fetch players' });
    }
  }

  if (req.method === 'PATCH') {
    const { id, status } = req.body;
    if (!id || !['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Valid id and status required' });
    }
    try {
      const { rows } = await pool.query(
        `UPDATE players SET status = $1 WHERE id = $2 AND active = TRUE RETURNING id, name, status`,
        [status, id]
      );
      if (rows.length === 0) return res.status(404).json({ error: 'Player not found' });
      return res.status(200).json(rows[0]);
    } catch (err) {
      console.error('PATCH /api/players error:', err);
      return res.status(500).json({ error: 'Failed to update player status' });
    }
  }

  res.setHeader('Allow', ['GET', 'PATCH']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
