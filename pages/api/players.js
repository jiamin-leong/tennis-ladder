import pool from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { status } = req.query;
    try {
      const { rows } = await pool.query(
        status === 'all'
          ? `SELECT id, name, preferred_name, whatsapp_name, points, wins, losses, status, gender, preferred_locations, joined_at
             FROM players WHERE active = TRUE
             ORDER BY
               CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
               points DESC, wins DESC, joined_at ASC`
          : `SELECT id, name, preferred_name, whatsapp_name, points, wins, losses, status, joined_at
             FROM players WHERE active = TRUE AND status = 'approved'
             ORDER BY points DESC, wins DESC, joined_at ASC`
      );
      return res.status(200).json(rows);
    } catch (err) {
      console.error('GET /api/players error:', err);
      return res.status(500).json({ error: 'Failed to fetch players' });
    }
  }

  if (req.method === 'POST') {
    const { name, whatsapp_name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Player name is required' });
    }

    const existing = await pool.query(
      'SELECT id FROM players WHERE LOWER(name) = LOWER($1)',
      [name.trim()]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'A player with that name already exists' });
    }

    try {
      const { rows } = await pool.query(
        `INSERT INTO players (name, whatsapp_name, status)
         VALUES ($1, $2, 'pending')
         RETURNING id, name, whatsapp_name, points, wins, losses, status, joined_at`,
        [name.trim(), whatsapp_name?.trim() || null]
      );
      return res.status(201).json(rows[0]);
    } catch (err) {
      console.error('POST /api/players error:', err);
      return res.status(500).json({ error: 'Failed to add player' });
    }
  }

  if (req.method === 'PATCH') {
    const { id, status } = req.body;
    if (!id || !['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Valid id and status required' });
    }
    try {
      const { rows } = await pool.query(
        `UPDATE players SET status = $1 WHERE id = $2 AND active = TRUE
         RETURNING id, name, status`,
        [status, id]
      );
      if (rows.length === 0) return res.status(404).json({ error: 'Player not found' });
      return res.status(200).json(rows[0]);
    } catch (err) {
      console.error('PATCH /api/players error:', err);
      return res.status(500).json({ error: 'Failed to update player status' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PATCH']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
