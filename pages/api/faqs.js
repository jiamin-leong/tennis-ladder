import pool from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { rows } = await pool.query(
        'SELECT id, question, answer, display_order FROM faqs ORDER BY display_order ASC, id ASC'
      );
      return res.status(200).json(rows);
    } catch (err) {
      console.error('GET /api/faqs error:', err);
      return res.status(500).json({ error: 'Failed to fetch FAQs' });
    }
  }

  if (req.method === 'POST') {
    const { question, answer } = req.body;
    if (!question?.trim() || !answer?.trim()) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }
    try {
      const orderRes = await pool.query('SELECT COALESCE(MAX(display_order), -1) + 1 AS next FROM faqs');
      const next = orderRes.rows[0].next;
      const { rows } = await pool.query(
        'INSERT INTO faqs (question, answer, display_order) VALUES ($1, $2, $3) RETURNING *',
        [question.trim(), answer.trim(), next]
      );
      return res.status(201).json(rows[0]);
    } catch (err) {
      console.error('POST /api/faqs error:', err);
      return res.status(500).json({ error: 'Failed to create FAQ' });
    }
  }

  if (req.method === 'PUT') {
    const { id, question, answer } = req.body;
    if (!id || !question?.trim() || !answer?.trim()) {
      return res.status(400).json({ error: 'id, question and answer are required' });
    }
    try {
      const { rows } = await pool.query(
        'UPDATE faqs SET question = $1, answer = $2 WHERE id = $3 RETURNING *',
        [question.trim(), answer.trim(), id]
      );
      if (rows.length === 0) return res.status(404).json({ error: 'FAQ not found' });
      return res.status(200).json(rows[0]);
    } catch (err) {
      console.error('PUT /api/faqs error:', err);
      return res.status(500).json({ error: 'Failed to update FAQ' });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required' });
    try {
      await pool.query('DELETE FROM faqs WHERE id = $1', [id]);
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('DELETE /api/faqs error:', err);
      return res.status(500).json({ error: 'Failed to delete FAQ' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
