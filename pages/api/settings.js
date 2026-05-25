import pool from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM ladder_settings ORDER BY id LIMIT 1'
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: 'No settings found' });
      }
      return res.status(200).json(rows[0]);
    } catch (err) {
      console.error('GET /api/settings error:', err);
      return res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }

  if (req.method === 'PUT') {
    const { name, start_date, end_date, allow_join, points_system, whatsapp_group } =
      req.body;

    if (!name || !start_date || !end_date) {
      return res.status(400).json({ error: 'name, start_date and end_date are required' });
    }

    try {
      const { rows } = await pool.query(
        `UPDATE ladder_settings
         SET name = $1,
             start_date = $2,
             end_date = $3,
             allow_join = $4,
             points_system = $5,
             whatsapp_group = $6,
             updated_at = NOW()
         WHERE id = (SELECT id FROM ladder_settings ORDER BY id LIMIT 1)
         RETURNING *`,
        [name, start_date, end_date, allow_join || 'bottom', points_system || 'standard', whatsapp_group || null]
      );
      return res.status(200).json(rows[0]);
    } catch (err) {
      console.error('PUT /api/settings error:', err);
      return res.status(500).json({ error: 'Failed to update settings' });
    }
  }

  res.setHeader('Allow', ['GET', 'PUT']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
