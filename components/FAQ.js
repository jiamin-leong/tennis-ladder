import { useState, useEffect } from 'react';

export default function FAQ() {
  const [faqs, setFaqs] = useState([]);
  const [open, setOpen] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/faqs')
      .then(r => r.ok ? r.json() : [])
      .then(data => { setFaqs(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem 0', color: '#9CA3AF' }}>Loading…</div>;

  if (faqs.length === 0) return (
    <div style={{ textAlign: 'center', padding: '3rem 0', color: '#9CA3AF', fontSize: 14 }}>
      No FAQs yet. Check back soon!
    </div>
  );

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
        Frequently asked questions
      </div>
      {faqs.map((item, i) => (
        <div key={item.id} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, marginBottom: 8, overflow: 'hidden' }}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            style={{
              width: '100%', textAlign: 'left', padding: '14px 16px',
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{item.question}</span>
            <span style={{ fontSize: 18, color: '#9CA3AF', flexShrink: 0, transform: open === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.15s' }}>+</span>
          </button>
          {open === i && (
            <div style={{ padding: '0 16px 14px', fontSize: 13, color: '#6B7280', lineHeight: 1.6, borderTop: '1px solid #F3F4F6' }}>
              <div style={{ paddingTop: 12 }}>
                {item.answer.split(/\n\n+/).map((para, pi) => (
                  <p key={pi} style={{ margin: 0, marginBottom: 10 }}>
                    {para.split('\n').map((line, li, arr) => (
                      <span key={li}>
                        {line}
                        {li < arr.length - 1 && <br />}
                      </span>
                    ))}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
