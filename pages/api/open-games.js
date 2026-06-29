import pool from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { playerId, dayOfWeek, timeBlock } = req.query;
    const pid = playerId ? parseInt(playerId) : null;

    const conditions = [
      `og.status != 'deleted'`,
      `(og.ladder_id IS NULL OR EXISTS (
        SELECT 1 FROM player_ladders pl
        WHERE pl.ladder_id = og.ladder_id AND pl.player_id = $1 AND pl.status = 'approved'
      ))`,
    ];
    const params = [pid];

    if (dayOfWeek !== undefined && dayOfWeek !== '') {
      params.push(parseInt(dayOfWeek));
      conditions.push(`EXTRACT(DOW FROM og.date) = $${params.length}`);
    }

    if (timeBlock) {
      if (timeBlock === 'morning')   conditions.push(`og.time >= '06:00' AND og.time < '12:00'`);
      if (timeBlock === 'afternoon') conditions.push(`og.time >= '12:00' AND og.time < '17:00'`);
      if (timeBlock === 'evening')   conditions.push(`og.time >= '17:00'`);
    }

    const where = conditions.join(' AND ');

    try {
      const { rows } = await pool.query(`
        SELECT og.*,
          COALESCE(p.preferred_name, p.name) AS creator_name,
          COUNT(DISTINCT gp_a.id) AS approved_count,
          COUNT(DISTINCT gp_w.id) AS waitlist_count,
          MAX(CASE WHEN gp_me.player_id = $1 THEN gp_me.status ELSE NULL END) AS my_status,
          l.name AS ladder_name, l.slug AS ladder_slug
        FROM open_games og
        LEFT JOIN players p ON p.id = og.creator_id
        LEFT JOIN game_participants gp_a ON gp_a.game_id = og.id AND gp_a.status = 'approved'
        LEFT JOIN game_participants gp_w ON gp_w.game_id = og.id AND gp_w.status = 'waitlist'
        LEFT JOIN game_participants gp_me ON gp_me.game_id = og.id AND gp_me.player_id = $1
        LEFT JOIN ladders l ON l.id = og.ladder_id
        WHERE ${where}
        GROUP BY og.id, p.preferred_name, p.name, l.name, l.slug
        ORDER BY og.date ASC, og.time ASC
      `, params);
      return res.status(200).json(rows);
    } catch (err) {
      console.error('GET /api/open-games error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'POST') {
    const { title, description, date, time, end_time, location, map_link, creator_id, ladder_id, max_players } = req.body;
    if (!title?.trim() || !date || !time || !location?.trim()) {
      return res.status(400).json({ error: 'title, date, time, location required' });
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO open_games (title, description, date, time, end_time, location, map_link, creator_id, ladder_id, max_players)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [title.trim(), description?.trim() || null, date, time, end_time || null, location.trim(),
         map_link?.trim() || null, creator_id || null, ladder_id || null, max_players || 2]
      );
      const game = rows[0];
      if (creator_id) {
        await client.query(
          `INSERT INTO game_participants (game_id, player_id, status) VALUES ($1, $2, 'approved') ON CONFLICT DO NOTHING`,
          [game.id, creator_id]
        );
      }
      await client.query('COMMIT');
      return res.status(201).json(game);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('POST /api/open-games error:', err);
      return res.status(500).json({ error: 'Server error' });
    } finally {
      client.release();
    }
  }

  if (req.method === 'PUT') {
    const { id, title, description, date, time, end_time, location, map_link, ladder_id, max_players, status, requesterId } = req.body;
    if (!id || !requesterId) return res.status(400).json({ error: 'id and requesterId required' });
    try {
      const { rows: check } = await pool.query(`SELECT creator_id FROM open_games WHERE id = $1`, [id]);
      if (!check.length || parseInt(check[0].creator_id) !== parseInt(requesterId)) {
        return res.status(403).json({ error: 'Not authorised' });
      }
      const { rows } = await pool.query(
        `UPDATE open_games SET title=$1, description=$2, date=$3, time=$4, end_time=$5, location=$6,
         map_link=$7, ladder_id=$8, max_players=$9, status=$10 WHERE id=$11 RETURNING *`,
        [title, description || null, date, time, end_time || null, location, map_link?.trim() || null,
         ladder_id || null, max_players, status || 'open', id]
      );
      return res.status(200).json(rows[0]);
    } catch (err) {
      console.error('PUT /api/open-games error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'DELETE') {
    const { id, requesterId } = req.body;
    if (!id || !requesterId) return res.status(400).json({ error: 'id and requesterId required' });
    try {
      const { rows: check } = await pool.query(`SELECT creator_id FROM open_games WHERE id = $1`, [id]);
      if (!check.length || parseInt(check[0].creator_id) !== parseInt(requesterId)) {
        return res.status(403).json({ error: 'Not authorised' });
      }
      await pool.query(`UPDATE open_games SET status = 'deleted' WHERE id = $1`, [id]);
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('DELETE /api/open-games error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
