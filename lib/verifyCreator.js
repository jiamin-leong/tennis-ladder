import pool from './db';

function normalizePhone(phone) {
  return phone ? phone.replace(/[\s\-().+]/g, '').trim() : '';
}

export async function verifyCreator(ladderId, requesterId) {
  if (!ladderId || !requesterId) return false;
  const { rows } = await pool.query(
    `SELECT l.creator_id, l.co_organiser_phones, p.phone
     FROM ladders l
     LEFT JOIN players p ON p.id = $2 AND p.active = TRUE
     WHERE l.id = $1`,
    [ladderId, requesterId]
  );
  if (rows.length === 0) return false;
  const { creator_id, co_organiser_phones, phone } = rows[0];
  if (parseInt(creator_id) === parseInt(requesterId)) return true;
  if (phone && co_organiser_phones?.includes(normalizePhone(phone))) return true;
  return false;
}
