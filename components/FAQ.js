import { useState } from 'react';

const FAQS = [
  {
    q: 'How are points calculated?',
    a: 'Points are awarded after each match based on the result. The admin sets the exact points for a win, loss, and draw in the Settings. Check with your admin for the current values.',
  },
  {
    q: 'How do I submit a match result?',
    a: 'Go to the "Submit Score" tab, select both players, enter the set scores, and hit Submit. Results are recorded immediately and the leaderboard updates in real time.',
  },
  {
    q: 'Can I submit a match result on behalf of my opponent?',
    a: 'Yes — either player can submit the result. Just make sure both of you agree on the score before submitting.',
  },
  {
    q: 'What if I entered the wrong score?',
    a: 'Contact the ladder admin to have the result corrected. Scores cannot be edited by participants directly.',
  },
  {
    q: 'When does the ladder season end?',
    a: 'The start and end dates are set by the admin and shown in the header. The leaderboard is frozen at the end date.',
  },
  {
    q: 'How do I challenge another player?',
    a: 'Currently challenges are arranged directly between players (e.g. via WhatsApp). Once you\'ve played, either of you can submit the score here.',
  },
  {
    q: 'What counts as a draw?',
    a: 'A draw can be awarded by the admin in exceptional circumstances (e.g. a match abandoned due to rain). Standard completed matches result in a win/loss.',
  },
  {
    q: 'What if someone drops out of the ladder?',
    a: 'The admin can remove inactive players. Any matches already recorded will remain in the history.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(null);

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
        Frequently asked questions
      </div>
      {FAQS.map((item, i) => (
        <div
          key={i}
          style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, marginBottom: 8, overflow: 'hidden' }}
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            style={{
              width: '100%', textAlign: 'left', padding: '14px 16px',
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{item.q}</span>
            <span style={{ fontSize: 18, color: '#9CA3AF', flexShrink: 0, transform: open === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.15s' }}>+</span>
          </button>
          {open === i && (
            <div style={{ padding: '0 16px 14px', fontSize: 13, color: '#6B7280', lineHeight: 1.6, borderTop: '1px solid #F3F4F6' }}>
              <div style={{ paddingTop: 12 }}>{item.a}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
