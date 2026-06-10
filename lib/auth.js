const SESSION_KEY = 'ladderlive_session';

export function saveSession(phone, player) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ phone, player }));
  } catch {}
}

export function loadSession() {
  try {
    const saved = localStorage.getItem(SESSION_KEY);
    if (!saved) return null;
    const { phone, player } = JSON.parse(saved);
    if (!phone || !player) return null;
    return { phone, player };
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
}
