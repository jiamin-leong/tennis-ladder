import pool from '../../lib/db';

function normalizePhone(phone) {
  return phone.replace(/[\s\-().+]/g, '').trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone } = req.body;
  if (!phone?.trim()) return res.status(400).json({ error: 'Phone number required' });

  const normalized = normalizePhone(phone);

  try {
    const { rows } = await pool.query(
      `SELECT id, name, preferred_name, gender, preferred_locations, status, is_admin
       FROM players WHERE phone = $1 AND active = TRUE`,
      [normalized]
    );

    if (rows.length === 0) return res.status(200).json({ exists: false });

    const player = rows[0];
    // Admin accounts must always go through the PIN flow
    if (player.is_admin) return res.status(200).json({ exists: true, requiresAdminPin: true });

    return res.status(200).json({ exists: true, player });
  } catch (err) {
    console.error('POST /api/auth error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
