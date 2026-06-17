import pool from '../../lib/db';

// Add new migration names here whenever a new migration script is created.
const REQUIRED_MIGRATIONS = [
  'setup-db',
  'migrate-db',
  'migrate-multi-tenant',
  'migrate-multi-ladder',
  'migrate-doubles',
  'migrate-phones',
  'migrate-add-pin',
];

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const { rows } = await pool.query(
      `SELECT name FROM _migrations WHERE name = ANY($1)`,
      [REQUIRED_MIGRATIONS]
    );

    const applied = new Set(rows.map(r => r.name));
    const missing = REQUIRED_MIGRATIONS.filter(m => !applied.has(m));

    if (missing.length > 0) {
      return res.status(503).json({
        status: 'error',
        message: 'DB schema is behind — run the missing migrations before deploying.',
        missing,
      });
    }

    return res.status(200).json({ status: 'ok', migrations: REQUIRED_MIGRATIONS.length });
  } catch (err) {
    return res.status(503).json({
      status: 'error',
      message: err.message,
    });
  }
}
