import pool from '../../lib/db';
import { verifyCreator } from '../../lib/verifyCreator';

function generateSlug() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

const LADDER_SELECT_BASE = `
  SELECT l.*,
    COUNT(DISTINCT pl.player_id) FILTER (WHERE pl.status = 'approved') AS player_count,
    COUNT(DISTINCT pl.player_id) FILTER (WHERE pl.status = 'pending')  AS pending_count,
    COUNT(DISTINCT m.id) AS match_count
  FROM ladders l
  LEFT JOIN player_ladders pl ON pl.ladder_id = l.id
  LEFT JOIN matches m ON m.ladder_id = l.id
`;

const LADDER_SELECT_MY = `
  SELECT l.*,
    COUNT(DISTINCT pl.player_id) FILTER (WHERE pl.status = 'approved') AS player_count,
    COUNT(DISTINCT pl.player_id) FILTER (WHERE pl.status = 'pending')  AS pending_count,
    COUNT(DISTINCT m.id) AS match_count,
    my.status AS my_status
  FROM ladders l
  LEFT JOIN player_ladders pl ON pl.ladder_id = l.id
  LEFT JOIN matches m ON m.ladder_id = l.id
`;

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { playerId, slug } = req.query;
    try {
      let query, params;

      if (slug) {
        query = playerId
          ? LADDER_SELECT_MY + ` LEFT JOIN player_ladders my ON my.ladder_id = l.id AND my.player_id = $2
              WHERE l.slug = $1 GROUP BY l.id, my.status`
          : LADDER_SELECT_BASE + ` WHERE l.slug = $1 GROUP BY l.id`;
        params = playerId ? [slug, playerId] : [slug];
        const { rows } = await pool.query(query, params);
        if (rows.length === 0) return res.status(404).json({ error: 'Ladder not found' });
        return res.status(200).json(rows[0]);
      }

      if (playerId) {
        query = LADDER_SELECT_MY + `
          LEFT JOIN player_ladders my ON my.ladder_id = l.id AND my.player_id = $1
          GROUP BY l.id, my.status
          ORDER BY l.start_date DESC`;
        params = [playerId];
      } else {
        // Public ladder directory
        query = LADDER_SELECT_BASE + `
          WHERE l.is_public = TRUE
          GROUP BY l.id
          ORDER BY l.start_date DESC`;
        params = [];
      }

      const { rows } = await pool.query(query, params);
      return res.status(200).json(rows);
    } catch (err) {
      console.error('GET /api/ladders error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'POST') {
    const { name, start_date, end_date, allow_join, win_pts, loss_pts, draw_pts, format, location, is_public, sport, creator_id } = req.body;
    if (!name?.trim() || !start_date || !end_date) {
      return res.status(400).json({ error: 'name, start_date, end_date required' });
    }
    const slug = generateSlug();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO ladders (name, slug, start_date, end_date, allow_join, win_pts, loss_pts, draw_pts, format, location, is_public, sport, creator_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
        [
          name.trim(), slug, start_date, end_date,
          allow_join || 'bottom',
          win_pts ?? 3, loss_pts ?? 0, draw_pts ?? 1,
          format === 'doubles' ? 'doubles' : 'singles',
          location?.trim() || null,
          is_public !== false,
          sport === 'pickleball' ? 'pickleball' : 'tennis',
          creator_id || null,
        ]
      );
      // Auto-add creator as approved member of their own ladder
      if (creator_id) {
        await client.query(
          `INSERT INTO player_ladders (player_id, ladder_id, status) VALUES ($1, $2, 'approved') ON CONFLICT DO NOTHING`,
          [creator_id, rows[0].id]
        );
      }
      await client.query('COMMIT');
      return res.status(201).json(rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('POST /api/ladders error:', err);
      return res.status(500).json({ error: 'Server error' });
    } finally {
      client.release();
    }
  }

  if (req.method === 'PUT') {
    const { id, name, start_date, end_date, allow_join, win_pts, loss_pts, draw_pts, format, location, is_public, co_organiser_phones, poster_image, requesterId } = req.body;
    if (!id) return res.status(400).json({ error: 'id required' });

    const isCreator = await verifyCreator(id, requesterId);
    if (!isCreator) return res.status(403).json({ error: 'Not authorised' });

    const normalizePhone = p => p.replace(/[\s\-().+]/g, '').trim();
    const cleanPhones = Array.isArray(co_organiser_phones)
      ? co_organiser_phones.map(normalizePhone).filter(Boolean)
      : [];

    try {
      const hasPoster = 'poster_image' in req.body;
      const { rows } = await pool.query(
        `UPDATE ladders SET name=$1, start_date=$2, end_date=$3, allow_join=$4,
         win_pts=$5, loss_pts=$6, draw_pts=$7, format=$8, location=$9, is_public=$10,
         co_organiser_phones=$11,
         ${hasPoster ? 'poster_image=$12,' : ''}
         updated_at=NOW()
         WHERE id=$${hasPoster ? 13 : 12} RETURNING *`,
        [name, start_date, end_date, allow_join, win_pts, loss_pts, draw_pts,
         format === 'doubles' ? 'doubles' : 'singles',
         location?.trim() || null,
         is_public !== false,
         cleanPhones,
         ...(hasPoster ? [poster_image ?? null] : []),
         id]
      );
      if (rows.length === 0) return res.status(404).json({ error: 'Ladder not found' });
      return res.status(200).json(rows[0]);
    } catch (err) {
      console.error('PUT /api/ladders error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT']);
  return res.status(405).json({ error: 'Method not allowed' });
}
