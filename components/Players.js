import { useState } from 'react';
import { profileEmoji } from '../lib/playerEmoji';

function formatPhone(raw) {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('65') && digits.length === 10) {
    return `+65 ${digits.slice(2, 6)} ${digits.slice(6)}`;
  }
  return digits;
}

const STATUS_BADGE = {
  approved: { label: 'Approved', bg: '#EAF3DE', color: '#3B6D11' },
  pending:  { label: 'Pending',  bg: '#FAEEDA', color: '#BA7517' },
  rejected: { label: 'Rejected', bg: '#FCEBEB', color: '#A32D2D' },
};

function PlayerRow({ player, i, ladderId, showApprove, showReject, onStatusChange }) {
  const badge = STATUS_BADGE[player.status] || STATUS_BADGE.approved;
  const displayName = player.preferred_name || player.name;
  const playerId = player.player_id ?? player.id;

  return (
    <div style={{ background: 'white', borderRadius: 10, marginBottom: 8, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
          {profileEmoji(playerId)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
            <span style={{ fontSize: 11, background: badge.bg, color: badge.color, padding: '2px 7px', borderRadius: 5, fontWeight: 600, flexShrink: 0 }}>
              {badge.label}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 12px' }}>
            {player.preferred_name && player.name !== player.preferred_name && (
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>{player.name}</span>
            )}
            {player.gender && (
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>{player.gender}</span>
            )}
            {player.preferred_locations && (
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>📍 {player.preferred_locations}</span>
            )}
            {player.phone && (
              <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>📞 {formatPhone(player.phone)}</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {showApprove && (
            <button
              onClick={() => onStatusChange(player.player_id ?? player.id, 'approved')}
              style={{ fontSize: 12, background: '#3B6D11', color: 'white', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}
            >
              Approve
            </button>
          )}
          {showReject && (
            <button
              onClick={() => onStatusChange(player.player_id ?? player.id, 'rejected')}
              style={{ fontSize: 12, background: '#FCEBEB', color: '#A32D2D', border: '1px solid #FECACA', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}
            >
              Reject
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Players({ players, ladderId, creatorId, onPlayersChange }) {
  const [error, setError] = useState('');

  async function updateStatus(playerId, status) {
    setError('');
    try {
      const res = await fetch('/api/player-ladders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, ladderId, status, requesterId: creatorId }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      onPlayersChange?.();
    } catch (err) {
      setError(err.message);
    }
  }

  const pending  = players.filter(p => p.status === 'pending');
  const approved = players.filter(p => p.status === 'approved');
  const rejected = players.filter(p => p.status === 'rejected');

  return (
    <div>
      {error && (
        <div style={{ background: '#FCEBEB', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#A32D2D', marginBottom: 12 }}>
          {error}
        </div>
      )}

      {pending.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#BA7517', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Awaiting approval ({pending.length})
          </div>
          {pending.map((p, i) => (
            <PlayerRow key={p.player_id ?? p.id} player={p} i={i} ladderId={ladderId} showApprove showReject={false} onStatusChange={updateStatus} />
          ))}
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          In ladder ({approved.length})
        </div>
        {approved.length === 0 ? (
          <div style={{ fontSize: 13, color: '#9CA3AF', padding: '8px 0' }}>No approved players yet.</div>
        ) : (
          approved.map((p, i) => (
            <PlayerRow key={p.player_id ?? p.id} player={p} i={i} ladderId={ladderId} showApprove={false} showReject onStatusChange={updateStatus} />
          ))
        )}
      </div>

      {rejected.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#A32D2D', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Rejected ({rejected.length})
          </div>
          {rejected.map((p, i) => (
            <PlayerRow key={p.player_id ?? p.id} player={p} i={i} ladderId={ladderId} showApprove showReject={false} onStatusChange={updateStatus} />
          ))}
        </div>
      )}
    </div>
  );
}
