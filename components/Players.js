import { useState, useRef } from 'react';

const colors = ['green', 'blue', 'amber', 'red'];
const avatarBg = {
  green: { bg: '#EAF3DE', text: '#3B6D11' },
  blue: { bg: '#E6F1FB', text: '#185FA5' },
  amber: { bg: '#FAEEDA', text: '#BA7517' },
  red: { bg: '#FCEBEB', text: '#A32D2D' },
};

function initials(name) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export default function Players({ players, onPlayersChange }) {
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [importedNames, setImportedNames] = useState([]);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef();

  async function addPlayer(name) {
    if (!name?.trim()) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add player');
      setNewName('');
      onPlayersChange?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const res = await fetch('/api/whatsapp-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Filter out already-added players
      const existing = new Set(players.map(p => p.name.toLowerCase()));
      const newNames = data.names.filter(n => !existing.has(n.toLowerCase()));
      setImportedNames(newNames);
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  }

  async function addAllImported() {
    for (const name of importedNames) {
      await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
    }
    setImportedNames([]);
    onPlayersChange?.();
  }

  return (
    <div>
      {/* WhatsApp import */}
      <div
        style={{ border: '1px dashed #D1D5DB', borderRadius: 12, padding: '1.5rem', textAlign: 'center', cursor: 'pointer', marginBottom: 16, background: 'white' }}
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept=".txt" style={{ display: 'none' }} onChange={handleFileUpload} />
        <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
        <div style={{ fontWeight: 500, marginBottom: 4 }}>
          {importing ? 'Parsing chat…' : 'Import from WhatsApp'}
        </div>
        <div style={{ fontSize: 13, color: '#6B7280' }}>
          Export your group chat (without media) and upload the .txt file
        </div>
      </div>

      {/* Imported names to confirm */}
      {importedNames.length > 0 && (
        <div style={{ background: '#EAF3DE', borderRadius: 12, padding: '1rem', marginBottom: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 8, color: '#27500A' }}>
            Found {importedNames.length} new participants
          </div>
          {importedNames.map(name => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ flex: 1, fontSize: 14 }}>{name}</span>
              <button
                onClick={() => { addPlayer(name); setImportedNames(prev => prev.filter(n => n !== name)); }}
                style={{ fontSize: 12, color: '#3B6D11', background: 'none', border: 'none', padding: 0 }}
              >
                + Add
              </button>
            </div>
          ))}
          <button
            onClick={addAllImported}
            style={{ marginTop: 8, background: '#3B6D11', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500 }}
          >
            Add all to ladder
          </button>
        </div>
      )}

      {/* Current players */}
      <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
        In ladder ({players.length})
      </div>

      {players.map((player, i) => {
        const color = colors[i % colors.length];
        const { bg, text } = avatarBg[color];
        return (
          <div key={player.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#F9FAFB', borderRadius: 8, marginBottom: 6 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: bg, color: text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>
              {initials(player.name)}
            </div>
            <span style={{ flex: 1, fontSize: 14 }}>{player.name}</span>
            <span style={{ fontSize: 12, background: '#EAF3DE', color: '#3B6D11', padding: '2px 8px', borderRadius: 6 }}>
              {player.points} pts
            </span>
          </div>
        );
      })}

      {/* Add player manually */}
      <div style={{ marginTop: 16 }}>
        <label style={{ display: 'block', fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Add player manually</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Full name"
            style={{ margin: 0 }}
            onKeyDown={e => e.key === 'Enter' && addPlayer(newName)}
          />
          <button
            onClick={() => addPlayer(newName)}
            disabled={loading}
            style={{ background: '#3B6D11', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', whiteSpace: 'nowrap', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '…' : 'Add'}
          </button>
        </div>
        {error && <div style={{ fontSize: 13, color: '#A32D2D', marginTop: 6 }}>{error}</div>}
      </div>
    </div>
  );
}
