import { useRouter } from 'next/router';
import { useState } from 'react';
import Head from 'next/head';
import { saveSession } from '../lib/auth';

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

export default function RegisterPage() {
  const router = useRouter();
  const { phone, returnTo } = router.query;

  const [form, setForm] = useState({ name: '', preferred_name: '', gender: '', preferred_locations: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return setError('Full name is required.');
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      saveSession(phone, data.player);
      router.push(returnTo || '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 };
  const fieldStyle = { marginBottom: 16 };

  return (
    <>
      <Head><title>Create profile — LadderLive</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
      <div style={{ minHeight: '100vh', background: '#F3F4F6', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🏆</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#27500A' }}>Create your profile</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Fill in your details to get started</div>
          </div>

          <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <form onSubmit={handleSubmit}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Full name *</label>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Tan Wei Jie" />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Preferred name <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(shown on leaderboard)</span></label>
                <input type="text" value={form.preferred_name} onChange={e => set('preferred_name', e.target.value)} placeholder="e.g. Wei Jie" />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Gender</label>
                <select value={form.gender} onChange={e => set('gender', e.target.value)}>
                  <option value="">Select…</option>
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Preferred courts / locations</label>
                <input type="text" value={form.preferred_locations} onChange={e => set('preferred_locations', e.target.value)} placeholder="e.g. Bishan, Kallang" />
              </div>

              {error && (
                <div style={{ background: '#FCEBEB', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#A32D2D', marginBottom: 12 }}>
                  {error}
                </div>
              )}

              <button
                type="submit" disabled={loading}
                style={{ width: '100%', padding: '13px', fontSize: 15, fontWeight: 600, background: loading ? '#9CA3AF' : '#3B6D11', color: 'white', border: 'none', borderRadius: 10, cursor: loading ? 'default' : 'pointer' }}
              >
                {loading ? 'Creating profile…' : 'Create profile →'}
              </button>
            </form>
          </div>

          <button onClick={() => router.back()} style={{ marginTop: 16, display: 'block', width: '100%', background: 'none', border: 'none', color: '#6B7280', fontSize: 13, cursor: 'pointer', textAlign: 'center' }}>
            ← Back
          </button>
        </div>
      </div>
    </>
  );
}
