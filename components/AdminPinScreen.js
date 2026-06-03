import { useState } from 'react';

export default function AdminPinScreen({ phone, onSuccess, onBack }) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!pin.trim()) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Incorrect PIN');
      onSuccess(data.player);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>🔒</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#27500A' }}>Admin verification</div>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 6 }}>
            Enter your admin PIN to continue
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <form onSubmit={handleSubmit}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              Admin PIN
            </label>
            <input
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="Enter PIN"
              autoFocus
              style={{ marginBottom: 0 }}
            />
            {error && (
              <div style={{ fontSize: 13, color: '#A32D2D', marginTop: 8 }}>{error}</div>
            )}
            <button
              type="submit"
              disabled={loading || !pin.trim()}
              style={{
                width: '100%', padding: '13px', fontSize: 15, fontWeight: 600, marginTop: 12,
                background: (loading || !pin.trim()) ? '#9CA3AF' : '#3B6D11',
                color: 'white', border: 'none', borderRadius: 10,
                cursor: (loading || !pin.trim()) ? 'default' : 'pointer',
              }}
            >
              {loading ? 'Verifying…' : 'Continue →'}
            </button>
          </form>
        </div>

        <button
          onClick={onBack}
          style={{ marginTop: 16, display: 'block', width: '100%', background: 'none', border: 'none', color: '#6B7280', fontSize: 13, cursor: 'pointer', textAlign: 'center' }}
        >
          ← Back to login
        </button>
      </div>
    </div>
  );
}
