/**
 * Given set scores, determine winner, sets won, and points to award.
 * Returns { winnerId, loserId, setsWon, setsLost, winnerPts, loserPts, scoreString }
 */
export function calculateMatch({ p1Id, p2Id, sets }) {
  let p1Sets = 0;
  let p2Sets = 0;
  const setParts = [];

  for (const set of sets) {
    if (set.p1 === null || set.p2 === null) continue;
    setParts.push(`${set.p1}-${set.p2}`);
    if (set.p1 > set.p2) p1Sets++;
    else if (set.p2 > set.p1) p2Sets++;
  }

  const scoreString = setParts.join(', ');
  const setsPlayed = p1Sets + p2Sets;

  let winnerId, loserId, winnerPts, loserPts;

  if (p1Sets > p2Sets) {
    winnerId = p1Id;
    loserId = p2Id;
  } else {
    winnerId = p2Id;
    loserId = p1Id;
  }

  // Scoring: straight sets = 3pts, three-setter = 2pts winner / 1pt loser
  if (setsPlayed === 2) {
    winnerPts = 3;
    loserPts = 0;
  } else {
    winnerPts = 2;
    loserPts = 1;
  }

  return { winnerId, loserId, winnerPts, loserPts, scoreString, setsPlayed };
}

/**
 * Parse a WhatsApp exported chat .txt and extract unique sender names.
 * WhatsApp format: "DD/MM/YYYY, HH:MM - Name: message"
 */
export function parseWhatsAppChat(text) {
  const lines = text.split('\n');
  const names = new Set();
  // Match both 12h and 24h WhatsApp formats
  const regex = /^\d{1,2}\/\d{1,2}\/\d{2,4},\s\d{1,2}:\d{2}(?:\s?[ap]m)?\s-\s([^:]+):/i;

  for (const line of lines) {
    const match = line.match(regex);
    if (match) {
      const name = match[1].trim();
      // Skip system messages
      if (!name.includes('Messages to this group') && name !== 'You') {
        names.add(name);
      }
    }
  }

  return Array.from(names).sort();
}
