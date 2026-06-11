import pool from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    const { id } = req.query;
    const { requesterId, preferred_name, gender, preferred_locations } = req.body;
    if (Number(requesterId) !== Number(id)) {
      return res.status(403).json({ error: 'You can only edit your own profile' });
    }
    try {
      const { rows } = await pool.query(
        `UPDATE players SET preferred_name = $1, gender = $2, preferred_locations = $3
         WHERE id = $4 AND active = TRUE
         RETURNING id, name, preferred_name, gender, preferred_locations`,
        [preferred_name?.trim() || null, gender || null, preferred_locations?.trim() || null, id]
      );
      if (rows.length === 0) return res.status(404).json({ error: 'Player not found' });
      return res.status(200).json({ player: rows[0] });
    } catch (err) {
      console.error('PUT /api/player/[id] error:', err);
      return res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET', 'PUT']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const { id } = req.query;
  try {
    const { rows } = await pool.query(
      `SELECT id, name, preferred_name, gender, preferred_locations, joined_at, status
       FROM players WHERE id = $1 AND active = TRUE`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Player not found' });

    const { rows: ladderRows } = await pool.query(
      `SELECT l.id, l.name, l.slug, l.format, l.start_date, l.end_date,
              pl.points, pl.wins, pl.losses, pl.status AS membership_status
       FROM player_ladders pl
       JOIN ladders l ON l.id = pl.ladder_id
       WHERE pl.player_id = $1
       ORDER BY l.start_date DESC`,
      [id]
    );

    return res.status(200).json({ ...rows[0], ladders: ladderRows });
  } catch (err) {
    console.error('GET /api/player/[id] error:', err);
    return res.status(500).json({ error: 'Failed to fetch player' });
  }
}
