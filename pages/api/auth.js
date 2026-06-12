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

  const { phone, pin, action } = req.body;
  if (!phone?.trim()) return res.status(400).json({ error: 'Phone number required' });

  const normalized = normalizePhone(phone);
  if (normalized.length !== 10) return res.status(400).json({ error: 'Phone number must be 8 digits' });

  try {
    const { rows } = await pool.query(
      `SELECT id, name, preferred_name, gender, preferred_locations, status, pin_hash
       FROM players WHERE phone = $1 AND active = TRUE`,
      [normalized]
    );

    // ── Step 1: phone check ──────────────────────────────────────────────────
    if (!action) {
      if (rows.length === 0) return res.status(200).json({ exists: false });
      return res.status(200).json({ exists: true, hasPin: !!rows[0].pin_hash });
    }

    if (rows.length === 0) return res.status(404).json({ error: 'Account not found' });
    const player = rows[0];

    // ── Step 2a: verify existing PIN ─────────────────────────────────────────
    if (action === 'verify') {
      if (!pin) return res.status(400).json({ error: 'PIN required' });
      if (!player.pin_hash) return res.status(400).json({ error: 'No PIN set for this account' });
      const ok = await bcrypt.compare(String(pin), player.pin_hash);
      if (!ok) return res.status(401).json({ error: 'Incorrect PIN' });
      const { pin_hash, ...safePlayer } = player;
      return res.status(200).json({ player: safePlayer });
    }

    // ── Step 2b: set PIN for existing account (migration / forgot) ────────────
    if (action === 'set-pin') {
      if (!pin) return res.status(400).json({ error: 'PIN required' });
      if (player.pin_hash) return res.status(409).json({ error: 'PIN already set' });
      const hash = await bcrypt.hash(String(pin), 10);
      await pool.query(`UPDATE players SET pin_hash = $1 WHERE id = $2`, [hash, player.id]);
      const { pin_hash, ...safePlayer } = player;
      return res.status(200).json({ player: safePlayer });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    console.error('POST /api/auth error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
