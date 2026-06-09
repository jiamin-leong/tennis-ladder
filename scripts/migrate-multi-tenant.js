require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.POSTGRES_URL, ssl: { rejectUnauthorized: false } });

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Running multi-tenant migration...');

    // 1. Add new columns to ladders
    await client.query(`ALTER TABLE ladders ADD COLUMN IF NOT EXISTS slug       TEXT`);
    await client.query(`ALTER TABLE ladders ADD COLUMN IF NOT EXISTS is_public  BOOLEAN NOT NULL DEFAULT TRUE`);
    await client.query(`ALTER TABLE ladders ADD COLUMN IF NOT EXISTS location   TEXT`);
    await client.query(`ALTER TABLE ladders ADD COLUMN IF NOT EXISTS creator_id INT REFERENCES players(id)`);

    // 2. Back-fill slugs for existing ladders (sanitised name + id suffix for uniqueness)
    await client.query(`
      UPDATE ladders
      SET slug = LOWER(
        REGEXP_REPLACE(
          REGEXP_REPLACE(name, '[^a-zA-Z0-9\\s]', '', 'g'),
          '\\s+', '-', 'g'
        )
      ) || '-' || id::TEXT
      WHERE slug IS NULL
    `);

    // 3. Enforce slug NOT NULL and uniqueness
    await client.query(`ALTER TABLE ladders ALTER COLUMN slug SET NOT NULL`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS ladders_slug_unique ON ladders (slug)`);

    // 4. Assign creator_id for existing ladders using the admin player
    const { rows: adminRows } = await client.query(
      `SELECT id FROM players WHERE is_admin = TRUE AND active = TRUE ORDER BY id LIMIT 1`
    );
    if (adminRows.length > 0) {
      await client.query(
        `UPDATE ladders SET creator_id = $1 WHERE creator_id IS NULL`,
        [adminRows[0].id]
      );
      console.log(`  Assigned creator_id = ${adminRows[0].id} to all existing ladders`);
    } else {
      console.log('  No admin player found — creator_id left NULL on existing ladders');
    }

    // 5. Drop is_admin from players (creator_id on ladders replaces it)
    await client.query(`ALTER TABLE players DROP COLUMN IF EXISTS is_admin`);

    await client.query('COMMIT');

    // Verify
    const { rows: ladders } = await client.query('SELECT id, name, slug, is_public, creator_id FROM ladders');
    console.log('\n  Ladders after migration:');
    ladders.forEach(l => console.log(`    [${l.id}] "${l.name}" → slug: ${l.slug}, public: ${l.is_public}, creator: ${l.creator_id}`));

    console.log('\n✅ Multi-tenant migration complete');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed, rolled back:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
