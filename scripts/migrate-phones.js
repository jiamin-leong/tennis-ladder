require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
});

async function migratePhones() {
  const client = await pool.connect();
  try {
    // Find all players whose phone doesn't start with '65'
    const { rows: toFix } = await client.query(
      `SELECT id, phone FROM players WHERE phone NOT LIKE '65%' AND phone IS NOT NULL`
    );

    if (toFix.length === 0) {
      console.log('All player phones already have the 65 prefix.');
    } else {
      console.log(`Found ${toFix.length} player(s) to update:`);
      for (const row of toFix) {
        const updated = `65${row.phone}`;
        console.log(`  id=${row.id}: "${row.phone}" → "${updated}"`);
      }

      await client.query(
        `UPDATE players SET phone = '65' || phone WHERE phone NOT LIKE '65%' AND phone IS NOT NULL`
      );
      console.log(`Updated ${toFix.length} player phone(s).`);
    }

    // Fix co_organiser_phones in ladders — update any entry in the array that lacks the 65 prefix
    const { rows: ladders } = await client.query(
      `SELECT id, co_organiser_phones FROM ladders WHERE co_organiser_phones IS NOT NULL AND array_length(co_organiser_phones, 1) > 0`
    );

    let ladderUpdates = 0;
    for (const ladder of ladders) {
      const fixed = ladder.co_organiser_phones.map(p =>
        p.startsWith('65') ? p : `65${p}`
      );
      const changed = fixed.some((p, i) => p !== ladder.co_organiser_phones[i]);
      if (changed) {
        await client.query(
          `UPDATE ladders SET co_organiser_phones = $1 WHERE id = $2`,
          [fixed, ladder.id]
        );
        console.log(`  ladder id=${ladder.id}: updated co_organiser_phones`);
        ladderUpdates++;
      }
    }

    if (ladderUpdates === 0) {
      console.log('All co_organiser_phones already have the 65 prefix.');
    } else {
      console.log(`Updated co_organiser_phones in ${ladderUpdates} ladder(s).`);
    }

    console.log('Done.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migratePhones();
