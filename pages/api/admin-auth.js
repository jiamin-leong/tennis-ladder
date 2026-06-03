import pool from '../../lib/db';

function normalizePhone(phone) {
  return phone.replace(/[\s\-().+]/g, '').trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone, pin } = req.body;

  if (!phone?.trim() || !pin?.trim()) {
    return res.status(400).json({ error: 'Phone and PIN required' });
  }

  const adminPin = process.env.ADMIN_PIN;
  if (!adminPin) {
    return res.status(503).json({ error: 'Admin access is not configured. Set ADMIN_PIN in your environment variables.' });
  }

  if (pin !== adminPin) {
    return res.status(401).json({ error: 'Incorrect PIN' });
  }

  const normalized = normalizePhone(phone);

  try {
    // Find or create admin account
    const existing = await pool.query(
      `SELECT id, name, preferred_name, status, is_admin FROM players WHERE phone = $1 AND active = TRUE`,
      [normalized]
    );

    if (existing.rows.length > 0) {
      // Promote to admin if not already
      const { rows } = await pool.query(
        `UPDATE players SET is_admin = TRUE, status = 'approved' WHERE phone = $1
         RETURNING id, name, preferred_name, status, is_admin`,
        [normalized]
      );
      return res.status(200).json({ player: rows[0] });
    }

    // Create new admin account
    const { rows } = await pool.query(
      `INSERT INTO players (phone, name, preferred_name, status, is_admin)
       VALUES ($1, 'Admin', 'Admin', 'approved', TRUE)
       RETURNING id, name, preferred_name, status, is_admin`,
      [normalized]
    );
    return res.status(200).json({ player: rows[0] });
  } catch (err) {
    console.error('POST /api/admin-auth error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
