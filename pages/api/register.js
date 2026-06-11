import pool from '../../lib/db';
import bcrypt from 'bcryptjs';

function normalizePhone(phone) {
  const digits = phone.replace(/[\s\-().+]/g, '').trim();
  return digits.startsWith('65') ? digits : `65${digits}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone, name, preferred_name, gender, preferred_locations, pin } = req.body;

  if (!phone?.trim() || !name?.trim()) {
    return res.status(400).json({ error: 'Phone and full name are required' });
  }
  if (!pin || String(pin).length < 4) {
    return res.status(400).json({ error: 'PIN must be at least 4 digits' });
  }

  const normalized = normalizePhone(phone);

  const existing = await pool.query('SELECT id FROM players WHERE phone = $1', [normalized]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'An account with this phone number already exists' });
  }

  try {
    const pinHash = await bcrypt.hash(String(pin), 10);
    const { rows } = await pool.query(
      `INSERT INTO players (phone, name, preferred_name, gender, preferred_locations, status, pin_hash)
       VALUES ($1, $2, $3, $4, $5, 'approved', $6)
       RETURNING id, name, preferred_name, status, is_admin`,
      [
        normalized,
        name.trim(),
        preferred_name?.trim() || name.trim(),
        gender || null,
        preferred_locations?.trim() || null,
        pinHash,
      ]
    );
    return res.status(201).json({ player: rows[0] });
  } catch (err) {
    console.error('POST /api/register error:', err);
    return res.status(500).json({ error: 'Failed to create profile' });
  }
}
