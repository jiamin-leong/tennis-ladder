import { useState } from 'react';

export default function LoginScreen({ ladderName, onContinue, onAdminLogin }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');

  async function handleContinue(e) {
    e.preventDefault();
    if (!phone.trim()) return;
    setError('');
    setLoading(true);
    try {
      await onContinue(phone.trim());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminLogin(e) {
    e.preventDefault();
    if (!adminPhone.trim() || !adminPin.trim()) return;
    setAdminError('');
    setAdminLoading(true);
    try {
      await onAdminLogin(adminPhone.trim(), adminPin.trim());
    } catch (err) {
      setAdminError(err.message);
    } finally {
      setAdminLoading(false);
    }
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', fontSize: 16,
    border: '1px solid #D1D5DB', borderRadius: 10, boxSizing: 'border-box',
    outline: 'none', marginBottom: 0,
  };

  const btnStyle = (disabled) => ({
    width: '100%', padding: '13px', fontSize: 15, fontWeight: 600,
    background: disabled ? '#9CA3AF' : '#3B6D11', color: 'white',
    border: 'none', borderRadius: 10, cursor: disabled ? 'default' : 'pointer',
    marginTop: 12,
  });

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo / header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🏆</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#27500A' }}>{ladderName}</div>
          <div style={{ fontSize: 14, color: '#6B7280', marginTop: 6 }}>Sign in to join the ladder</div>
        </div>

        {/* Main login card */}
        {!showAdmin ? (
          <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <form onSubmit={handleContinue}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                Phone number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+65 9123 4567"
                style={inputStyle}
                autoFocus
              />
              {error && (
                <div style={{ fontSize: 13, color: '#A32D2D', marginTop: 8 }}>{error}</div>
              )}
              <button type="submit" disabled={loading || !phone.trim()} style={btnStyle(loading || !phone.trim())}>
                {loading ? 'Checking…' : 'Continue →'}
              </button>
            </form>
          </div>
        ) : (
          /* Admin login card */
          <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#27500A', marginBottom: 16 }}>Admin login</div>
            <form onSubmit={handleAdminLogin}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                Phone number
              </label>
              <input
                type="tel"
                value={adminPhone}
                onChange={e => setAdminPhone(e.target.value)}
                placeholder="+65 9123 4567"
                style={{ ...inputStyle, marginBottom: 12 }}
              />
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                Admin PIN
              </label>
              <input
                type="password"
                value={adminPin}
                onChange={e => setAdminPin(e.target.value)}
                placeholder="Enter PIN"
                style={inputStyle}
              />
              {adminError && (
                <div style={{ fontSize: 13, color: '#A32D2D', marginTop: 8 }}>{adminError}</div>
              )}
              <button type="submit" disabled={adminLoading || !adminPhone.trim() || !adminPin.trim()} style={btnStyle(adminLoading)}>
                {adminLoading ? 'Signing in…' : 'Sign in as admin'}
              </button>
            </form>
            <button
              onClick={() => { setShowAdmin(false); setAdminError(''); }}
              style={{ marginTop: 12, width: '100%', background: 'none', border: 'none', color: '#6B7280', fontSize: 13, cursor: 'pointer' }}
            >
              ← Back
            </button>
          </div>
        )}

        {/* Admin toggle link */}
        {!showAdmin && (
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button
              onClick={() => setShowAdmin(true)}
              style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Admin login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
