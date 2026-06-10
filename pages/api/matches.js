import pool from '../../lib/db';
import { verifyCreator } from '../../lib/verifyCreator';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { playerId, ladderId } = req.query;
    try {
      const baseSelect = `
          SELECT m.id, m.score, m.winner_pts, m.loser_pts, m.court, m.played_at,
            w.id  AS winner_id,         COALESCE(w.preferred_name,  w.name)  AS winner_name,
            wp.id AS winner_partner_id, COALESCE(wp.preferred_name, wp.name) AS winner_partner_name,
            l.id  AS loser_id,          COALESCE(l.preferred_name,  l.name)  AS loser_name,
            lp.id AS loser_partner_id,  COALESCE(lp.preferred_name, lp.name) AS loser_partner_name
          FROM matches m
          JOIN players w ON m.winner_id = w.id
          JOIN players l ON m.loser_id  = l.id
          LEFT JOIN players wp ON m.winner_partner_id = wp.id
          LEFT JOIN players lp ON m.loser_partner_id  = lp.id`;

      let query, params;

      if (playerId && ladderId) {
        query = baseSelect + `
          WHERE m.ladder_id = $1
            AND (w.id = $2 OR l.id = $2 OR wp.id = $2 OR lp.id = $2)
          ORDER BY m.played_at DESC LIMIT 100`;
        params = [ladderId, playerId];
      } else if (ladderId) {
        query = baseSelect + ` WHERE m.ladder_id = $1 ORDER BY m.played_at DESC LIMIT 50`;
        params = [ladderId];
      } else if (playerId) {
        query = baseSelect + `
          WHERE w.id = $1 OR l.id = $1 OR wp.id = $1 OR lp.id = $1
          ORDER BY m.played_at DESC LIMIT 100`;
        params = [playerId];
      } else {
        query = baseSelect + ` ORDER BY m.played_at DESC LIMIT 50`;
        params = [];
      }

      const { rows } = await pool.query(query, params);
      return res.status(200).json(rows);
    } catch (err) {
      console.error('GET /api/matches error:', err);
      return res.status(500).json({ error: 'Failed to fetch matches' });
    }
  }

  if (req.method === 'POST') {
    const { p1Id, p1PartnerId, p2Id, p2PartnerId, winnerId, score, court, playedAt, ladderId } = req.body;

    if (!p1Id || !p2Id || !winnerId || !ladderId) {
      return res.status(400).json({ error: 'p1Id, p2Id, winnerId, and ladderId are required' });
    }
    if (p1Id === p2Id) {
      return res.status(400).json({ error: 'Players must be different' });
    }

    const isDraw = winnerId === 'draw';
    // For doubles, winnerId is 'p1side' or 'p2side'; for singles it's the actual player id
    const isDoublesWin = winnerId === 'p1side' || winnerId === 'p2side';
    if (!isDraw && !isDoublesWin && winnerId !== p1Id && winnerId !== p2Id) {
      return res.status(400).json({ error: 'Invalid winnerId' });
    }

    const ladderRes = await pool.query(
      'SELECT win_pts, loss_pts, draw_pts, format FROM ladders WHERE id = $1',
      [ladderId]
    );
    if (ladderRes.rows.length === 0) return res.status(404).json({ error: 'Ladder not found' });
    const { win_pts = 3, loss_pts = 0, draw_pts = 1 } = ladderRes.rows[0];

    // Resolve who is winner/loser
    let resolvedWinnerId, resolvedWinnerPartnerId, resolvedLoserId, resolvedLoserPartnerId;
    if (isDraw) {
      resolvedWinnerId = p1Id;
      resolvedWinnerPartnerId = p1PartnerId || null;
      resolvedLoserId = p2Id;
      resolvedLoserPartnerId = p2PartnerId || null;
    } else if (isDoublesWin ? winnerId === 'p1side' : (winnerId === p1Id || winnerId === String(p1Id))) {
      resolvedWinnerId = p1Id;
      resolvedWinnerPartnerId = p1PartnerId || null;
      resolvedLoserId = p2Id;
      resolvedLoserPartnerId = p2PartnerId || null;
    } else {
      resolvedWinnerId = p2Id;
      resolvedWinnerPartnerId = p2PartnerId || null;
      resolvedLoserId = p1Id;
      resolvedLoserPartnerId = p1PartnerId || null;
    }

    const winnerPts = isDraw ? draw_pts : win_pts;
    const loserPts  = isDraw ? draw_pts : loss_pts;
    const scoreStr  = score?.trim() || (isDraw ? 'Draw' : '—');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `INSERT INTO matches (winner_id, winner_partner_id, loser_id, loser_partner_id,
           score, sets_played, winner_pts, loser_pts, court, played_at, ladder_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id`,
        [
          resolvedWinnerId, resolvedWinnerPartnerId,
          resolvedLoserId,  resolvedLoserPartnerId,
          scoreStr, 0, winnerPts, loserPts,
          court?.trim() || null,
          playedAt ? new Date(playedAt) : new Date(),
          ladderId,
        ]
      );

      // Update points for all players involved
      const winnerIds = [resolvedWinnerId, resolvedWinnerPartnerId].filter(Boolean);
      const loserIds  = [resolvedLoserId,  resolvedLoserPartnerId].filter(Boolean);

      if (isDraw) {
        const allIds = [...winnerIds, ...loserIds];
        for (const pid of allIds) {
          await client.query(
            `UPDATE player_ladders SET points = points + $1 WHERE ladder_id = $2 AND player_id = $3`,
            [draw_pts, ladderId, pid]
          );
        }
      } else {
        for (const pid of winnerIds) {
          await client.query(
            `UPDATE player_ladders SET points = points + $1, wins = wins + 1 WHERE ladder_id = $2 AND player_id = $3`,
            [win_pts, ladderId, pid]
          );
        }
        for (const pid of loserIds) {
          await client.query(
            `UPDATE player_ladders SET points = points + $1, losses = losses + 1 WHERE ladder_id = $2 AND player_id = $3`,
            [loss_pts, ladderId, pid]
          );
        }
      }

      await client.query('COMMIT');

      return res.status(201).json({
        matchId: rows[0].id,
        winnerId: resolvedWinnerId,
        loserId: resolvedLoserId,
        winnerPts,
        loserPts,
        isDraw,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('POST /api/matches error:', err);
      return res.status(500).json({ error: 'Failed to submit match' });
    } finally {
      client.release();
    }
  }

  if (req.method === 'DELETE') {
    const { matchId, requesterId } = req.body;
    if (!matchId) return res.status(400).json({ error: 'matchId required' });

    const client = await pool.connect();
    try {
      const { rows } = await client.query(
        `SELECT winner_id, winner_partner_id, loser_id, loser_partner_id,
                winner_pts, loser_pts, score, ladder_id
         FROM matches WHERE id = $1`,
        [matchId]
      );
      if (rows.length === 0) return res.status(404).json({ error: 'Match not found' });

      const m = rows[0];
      const isCreator = await verifyCreator(m.ladder_id, requesterId);
      if (!isCreator) return res.status(403).json({ error: 'Not authorised' });
      const isDraw = m.score === 'Draw';
      const winnerIds = [m.winner_id, m.winner_partner_id].filter(Boolean);
      const loserIds  = [m.loser_id,  m.loser_partner_id].filter(Boolean);

      await client.query('BEGIN');

      // Reverse points for winners
      for (const pid of winnerIds) {
        await client.query(
          `UPDATE player_ladders SET points = points - $1${isDraw ? '' : ', wins = wins - 1'}
           WHERE ladder_id = $2 AND player_id = $3`,
          [m.winner_pts, m.ladder_id, pid]
        );
      }
      // Reverse points for losers
      for (const pid of loserIds) {
        await client.query(
          `UPDATE player_ladders SET points = points - $1${isDraw ? '' : ', losses = losses - 1'}
           WHERE ladder_id = $2 AND player_id = $3`,
          [m.loser_pts, m.ladder_id, pid]
        );
      }

      await client.query('DELETE FROM matches WHERE id = $1', [matchId]);
      await client.query('COMMIT');

      return res.status(200).json({ deleted: matchId });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('DELETE /api/matches error:', err);
      return res.status(500).json({ error: 'Failed to delete match' });
    } finally {
      client.release();
    }
  }

  if (req.method === 'PUT') {
    const { matchId, requesterId, newWinnerSide, score, court, playedAt } = req.body;
    // newWinnerSide: 'same' | 'swap' | 'draw'
    if (!matchId) return res.status(400).json({ error: 'matchId required' });

    const client = await pool.connect();
    try {
      const { rows } = await client.query(
        `SELECT winner_id, winner_partner_id, loser_id, loser_partner_id,
                winner_pts, loser_pts, score AS old_score, ladder_id
         FROM matches WHERE id = $1`,
        [matchId]
      );
      if (rows.length === 0) return res.status(404).json({ error: 'Match not found' });
      const old = rows[0];

      const isCreator = await verifyCreator(old.ladder_id, requesterId);
      if (!isCreator) return res.status(403).json({ error: 'Not authorised' });

      const ladderRes = await pool.query(
        'SELECT win_pts, loss_pts, draw_pts FROM ladders WHERE id = $1',
        [old.ladder_id]
      );
      const { win_pts, loss_pts, draw_pts } = ladderRes.rows[0];

      const wasDrawn = old.old_score === 'Draw';
      const oldWinnerIds = [old.winner_id, old.winner_partner_id].filter(Boolean);
      const oldLoserIds  = [old.loser_id,  old.loser_partner_id].filter(Boolean);

      const isNowDraw = newWinnerSide === 'draw';
      const swapped   = newWinnerSide === 'swap';

      const newWinnerId        = swapped ? old.loser_id         : old.winner_id;
      const newWinnerPartnerId = swapped ? old.loser_partner_id : old.winner_partner_id;
      const newLoserId         = swapped ? old.winner_id        : old.loser_id;
      const newLoserPartnerId  = swapped ? old.winner_partner_id: old.loser_partner_id;

      const newWinnerIds = [newWinnerId, newWinnerPartnerId].filter(Boolean);
      const newLoserIds  = [newLoserId,  newLoserPartnerId].filter(Boolean);
      const newWinnerPts = isNowDraw ? draw_pts : win_pts;
      const newLoserPts  = isNowDraw ? draw_pts : loss_pts;

      await client.query('BEGIN');

      // Reverse old points
      if (wasDrawn) {
        for (const pid of [...oldWinnerIds, ...oldLoserIds]) {
          await client.query(
            `UPDATE player_ladders SET points = points - $1 WHERE ladder_id = $2 AND player_id = $3`,
            [old.winner_pts, old.ladder_id, pid]
          );
        }
      } else {
        for (const pid of oldWinnerIds) {
          await client.query(
            `UPDATE player_ladders SET points = points - $1, wins = wins - 1 WHERE ladder_id = $2 AND player_id = $3`,
            [old.winner_pts, old.ladder_id, pid]
          );
        }
        for (const pid of oldLoserIds) {
          await client.query(
            `UPDATE player_ladders SET points = points - $1, losses = losses - 1 WHERE ladder_id = $2 AND player_id = $3`,
            [old.loser_pts, old.ladder_id, pid]
          );
        }
      }

      // Apply new points
      if (isNowDraw) {
        for (const pid of [...newWinnerIds, ...newLoserIds]) {
          await client.query(
            `UPDATE player_ladders SET points = points + $1 WHERE ladder_id = $2 AND player_id = $3`,
            [draw_pts, old.ladder_id, pid]
          );
        }
      } else {
        for (const pid of newWinnerIds) {
          await client.query(
            `UPDATE player_ladders SET points = points + $1, wins = wins + 1 WHERE ladder_id = $2 AND player_id = $3`,
            [win_pts, old.ladder_id, pid]
          );
        }
        for (const pid of newLoserIds) {
          await client.query(
            `UPDATE player_ladders SET points = points + $1, losses = losses + 1 WHERE ladder_id = $2 AND player_id = $3`,
            [loss_pts, old.ladder_id, pid]
          );
        }
      }

      await client.query(
        `UPDATE matches SET
           winner_id = $1, winner_partner_id = $2,
           loser_id  = $3, loser_partner_id  = $4,
           winner_pts = $5, loser_pts = $6,
           score = $7, court = $8, played_at = $9
         WHERE id = $10`,
        [
          newWinnerId, newWinnerPartnerId || null,
          newLoserId,  newLoserPartnerId  || null,
          newWinnerPts, newLoserPts,
          score?.trim() || (isNowDraw ? 'Draw' : '—'),
          court?.trim() || null,
          playedAt ? new Date(playedAt) : new Date(),
          matchId,
        ]
      );

      await client.query('COMMIT');
      return res.status(200).json({ updated: matchId });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('PUT /api/matches error:', err);
      return res.status(500).json({ error: 'Failed to update match' });
    } finally {
      client.release();
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
