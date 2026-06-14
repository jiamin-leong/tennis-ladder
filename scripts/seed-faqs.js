require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

const FAQS = [
  {
    question: 'How do I arrange a match?',
    answer: `Players are to arrange their own court venue, location and time. For instance: "Looking for a match on 1 Nov (Wed) from 8–10pm. Court booked at Kallang Tennis Hub."

** Highly advise that players bring balls if they are not hosting the session unless agreed otherwise.
** If you can only book the court for an hour, a pro-set (first to 8 games) is recommended.`,
  },
  {
    question: 'When does the ladder run?',
    answer: `Ladder matches will start from 2 February and end on 26 April 2026. All scores have to be reported by 26 April 2359.`,
  },
  {
    question: 'What are the match rules?',
    answer: `Matches are to be played to the best of 3 tie-break sets. At 6 games all, a tie-break will be played. The tie-break will be based on first to reach 7 points winning by a margin of 2 points. If the match runs out of time, a 3rd set may be played as a 10-point tiebreak.`,
  },
  {
    question: 'What scoring format is used?',
    answer: `To increase the chance of the match being played through, all matches are expected to be played with "no ad" scoring. However, regular deuce with advantage may be used only if both players agree beforehand.`,
  },
  {
    question: 'What happens if a match is stopped early?',
    answer: `In case of injury, or stopping of match before the agreed completion time (e.g. work call or any other emergencies or arguments on court), the defeated player is the one who stopped the match.`,
  },
  {
    question: 'What happens if a match cannot be completed due to weather or time?',
    answer: `In the event that a match cannot be completed due to time constraints, weather conditions (rain, lightning, haze), or any unforeseen circumstances, the following rules will apply:

Any match that is not fully completed — whether stopped during the first set or the second set — will be recorded as a draw, regardless of the score at the time of stoppage.

Players are strongly encouraged to play out and complete their matches where possible.

If a match cannot be completed on the same day, players may mutually agree to continue and complete the match on another day.

If players agree to play best of 3 sets, the match must be fully completed (including a deciding set or super tiebreak, where applicable) for a result to be recorded.
If players agree to play a pro-set format, the match will be considered complete once a player reaches 8 games.

The organiser reserves the right to make the final decision in cases of dispute.`,
  },
  {
    question: 'Can I play multiple matches against the same opponent on the same day?',
    answer: `To ensure fairness in the ladder:

Players may only record one pro-set result on the same day against the same opponent during the ladder phase.

Multiple pro-sets played against the same opponent cannot be recorded as separate matches, even if the scores are different.

Example (NOT allowed):
Match: 2 February, 10am–12pm at YCK Tennis Centre
Luke defeated Tom 8–1
Luke defeated Tom 8–2
❌ Only one pro-set result may be recorded.

Two separate match results will only be accepted if both matches are fully completed best-of-3-set matches.

Example (Allowed):
Match: 2 February, 10am–12pm at YCK Tennis Centre
Match 1: Luke defeated Tom 6–3, 6–2
Match 2: Luke defeated Tom 6–2, 6–2
✅ Both matches may be recorded as separate results.

This rule applies regardless of whether matches are played on the same day or different days. The organiser reserves the right to reject match results that do not comply with this rule.`,
  },
  {
    question: 'How does the points system work?',
    answer: `Ladder is based on a points system:
• 4 pts for the Winner
• 1 pt for Draw and Walkover
• 1 pt for Participation`,
  },
  {
    question: 'How many times can I play the same player?',
    answer: `Players are only allowed to play the same player a maximum of 3 times.`,
  },
  {
    question: 'What happens if I arrive late?',
    answer: `Any player arriving more than 20 minutes after the agreed-upon match time will concede a one-set walkover to their opponent.`,
  },
  {
    question: 'How do I coordinate and report match scores?',
    answer: `To ensure clear match coordination and accurate score reporting, the following process must be followed:

When a player is hosting a match, they must post the match details in the WhatsApp group (date, time, venue).

Example:
Luke: Looking for a game on 3 February, 8–10am at Kallang Tennis Hub.

Once an opponent has confirmed the match, the host must reply to their own post with "Player Found (PF)".

After the match is completed, either player must reply directly to the original host post with the match score.

Scores posted outside of the original host message thread may not be recorded.

This rule helps ensure clarity, avoids duplicate matches, and allows the organiser to accurately track results.`,
  },
  {
    question: 'Who should report the match score?',
    answer: `The player who booked the court should report the match score directly after the matches have been played — either on the group chat or PM Ee Lin (91278026) or Christabelle (98573322).`,
  },
  {
    question: 'What is the code of conduct?',
    answer: `All participants are expected to uphold a standard of good sportsmanship and respectful behaviour throughout the tournament.

Players may be sanctioned or removed from the tournament if there are multiple reports of poor conduct from fellow participants. Decisions will be made at the organiser's discretion.

Examples of poor sportsmanship include, but are not limited to:
- Excessive or aggressive swearing during matches
- Racket abuse or aggressive behaviour
- Poor time management (arriving more than 20 minutes late for a scheduled match)
- Repeated last-minute cancellations without valid reason
- Unfair or dishonest line calling
- Any behaviour that causes discomfort, intimidation, or an unpleasant experience for the opposing player

Punctuality Rule:
If a player arrives more than 20 minutes late on three separate occasions, they will be banned from continuing in the tournament.

Reporting & Disputes:
All participants may submit reports based on their experiences. Reports will be kept private and confidential. Reports and disputes should be raised with Ee Lin or Christabelle within 24 hours of the match.

The organiser reserves the right to make the final decision in all matters relating to conduct, disputes, and disciplinary actions.`,
  },
  {
    question: 'Are there prizes?',
    answer: `There will be a knockout round for the top 16 in the ladder. Champion & Runner-Up will receive a trophy and some goodie bags at the end of the ladder!`,
  },
];

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM faqs');
    for (let i = 0; i < FAQS.length; i++) {
      await client.query(
        'INSERT INTO faqs (question, answer, display_order) VALUES ($1, $2, $3)',
        [FAQS[i].question, FAQS[i].answer, i]
      );
    }
    await client.query('COMMIT');
    console.log(`✅ Inserted ${FAQS.length} FAQs`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => { console.error(err); process.exit(1); });
