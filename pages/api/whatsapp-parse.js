import { parseWhatsAppChat } from '../../lib/utils';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb', // WhatsApp exports can be large
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text field is required' });
  }

  try {
    const names = parseWhatsAppChat(text);
    return res.status(200).json({ names });
  } catch (err) {
    console.error('POST /api/whatsapp-parse error:', err);
    return res.status(500).json({ error: 'Failed to parse chat file' });
  }
}
