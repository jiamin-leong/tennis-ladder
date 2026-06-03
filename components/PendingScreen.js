export default function PendingScreen({ player, onLogout }) {
  const displayName = player?.preferred_name || player?.name || 'there';

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>⏳</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#27500A', marginBottom: 8 }}>
          You're on the list, {displayName}!
        </div>
        <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, marginBottom: 32 }}>
          Your profile has been submitted and is awaiting admin approval.
          You'll be able to join the ladder once approved.
        </div>
        <div style={{ background: '#EAF3DE', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: 24, textAlign: 'left' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#3B6D11', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            What happens next
          </div>
          <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7 }}>
            1. The ladder admin will review your profile<br />
            2. Once approved, sign back in with your phone number<br />
            3. Start submitting match scores and climbing the ladder!
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{ background: 'none', border: '1px solid #D1D5DB', borderRadius: 8, padding: '10px 24px', fontSize: 14, color: '#6B7280', cursor: 'pointer' }}
        >
          Back to login
        </button>
      </div>
    </div>
  );
}
