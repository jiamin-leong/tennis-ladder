import pool from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { playerId } = req.query;
    try {
      const query = playerId
        ? `SELECT l.*,
            COUNT(DISTINCT pl.player_id) FILTER (WHERE pl.status = 'approved') AS player_count,
            COUNT(DISTINCT pl.player_id) FILTER (WHERE pl.status = 'pending')  AS pending_count,
            my.status AS my_status
           FROM ladders l
           LEFT JOIN player_ladders pl ON pl.ladder_id = l.id
           LEFT JOIN player_ladders my ON my.ladder_id = l.id AND my.player_id = $1
           GROUP BY l.id, my.status
           ORDER BY l.start_date DESC`
        : `SELECT l.*,
            COUNT(DISTINCT pl.player_id) FILTER (WHERE pl.status = 'approved') AS player_count,
            COUNT(DISTINCT pl.player_id) FILTER (WHERE pl.status = 'pending')  AS pending_count
           FROM ladders l
           LEFT JOIN player_ladders pl ON pl.ladder_id = l.id
           GROUP BY l.id
           ORDER BY l.start_date DESC`;

      const { rows } = await pool.query(query, playerId ? [playerId] : []);
      return res.status(200).json(rows);
    } catch (err) {
      console.error('GET /api/ladders error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'POST') {
    const { name, start_date, end_date, allow_join, win_pts, loss_pts, draw_pts, format } = req.body;
    if (!name?.trim() || !start_date || !end_date) {
      return res.status(400).json({ error: 'name, start_date, end_date required' });
    }
    try {
      const { rows } = await pool.query(
        `INSERT INTO ladders (name, start_date, end_date, allow_join, win_pts, loss_pts, draw_pts, format)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [name.trim(), start_date, end_date,
         allow_join || 'bottom',
         win_pts ?? 3, loss_pts ?? 0, draw_pts ?? 1,
         format === 'doubles' ? 'doubles' : 'singles']
      );
      return res.status(201).json(rows[0]);
    } catch (err) {
      console.error('POST /api/ladders error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'PUT') {
    const { id, name, start_date, end_date, allow_join, win_pts, loss_pts, draw_pts, format } = req.body;
    if (!id) return res.status(400).json({ error: 'id required' });
    try {
      const { rows } = await pool.query(
        `UPDATE ladders SET name=$1, start_date=$2, end_date=$3, allow_join=$4,
         win_pts=$5, loss_pts=$6, draw_pts=$7, format=$8, updated_at=NOW()
         WHERE id=$9 RETURNING *`,
        [name, start_date, end_date, allow_join, win_pts, loss_pts, draw_pts,
         format === 'doubles' ? 'doubles' : 'singles', id]
      );
      if (rows.length === 0) return res.status(404).json({ error: 'Ladder not found' });
      return res.status(200).json(rows[0]);
    } catch (err) {
      console.error('PUT /api/ladders error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT']);
  return res.status(405).json({ error: 'Method not allowed' });
}
