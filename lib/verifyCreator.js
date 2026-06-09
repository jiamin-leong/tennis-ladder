import pool from './db';

export async function verifyCreator(ladderId, requesterId) {
  if (!ladderId || !requesterId) return false;
  const { rows } = await pool.query(
    'SELECT creator_id FROM ladders WHERE id = $1',
    [ladderId]
  );
  if (rows.length === 0) return false;
  return parseInt(rows[0].creator_id) === parseInt(requesterId);
}
