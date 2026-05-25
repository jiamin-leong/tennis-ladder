import pool from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { rows } = await pool.query(
        `SELECT id, name, whatsapp_name, points, wins, losses, joined_at
         FROM players
         WHERE active = TRUE
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

    // Check if player already exists
    const existing = await pool.query(
      'SELECT id FROM players WHERE LOWER(name) = LOWER($1)',
      [name.trim()]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'A player with that name already exists' });
    }

    try {
      const { rows } = await pool.query(
        `INSERT INTO players (name, whatsapp_name)
         VALUES ($1, $2)
         RETURNING id, name, whatsapp_name, points, wins, losses, joined_at`,
        [name.trim(), whatsapp_name?.trim() || null]
      );
      return res.status(201).json(rows[0]);
    } catch (err) {
      console.error('POST /api/players error:', err);
      return res.status(500).json({ error: 'Failed to add player' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
