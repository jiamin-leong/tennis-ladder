import pool from '../../lib/db';

function normalizePhone(phone) {
  return phone.replace(/[\s\-().+]/g, '').trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone, name, preferred_name, gender, preferred_locations, ladderIds = [] } = req.body;

  if (!phone?.trim() || !name?.trim()) {
    return res.status(400).json({ error: 'Phone and full name are required' });
  }

  const normalized = normalizePhone(phone);

  const existing = await pool.query('SELECT id FROM players WHERE phone = $1', [normalized]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'An account with this phone number already exists' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO players (phone, name, preferred_name, gender, preferred_locations, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING id, name, preferred_name, status, is_admin`,
      [
        normalized,
        name.trim(),
        preferred_name?.trim() || name.trim(),
        gender || null,
        preferred_locations?.trim() || null,
      ]
    );

    const playerId = rows[0].id;

    for (const ladderId of ladderIds) {
      await client.query(
        `INSERT INTO player_ladders (player_id, ladder_id, status)
         VALUES ($1, $2, 'pending') ON CONFLICT DO NOTHING`,
        [playerId, ladderId]
      );
    }

    await client.query('COMMIT');
    return res.status(201).json({ player: rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /api/register error:', err);
    return res.status(500).json({ error: 'Failed to create profile' });
  } finally {
    client.release();
  }
}
