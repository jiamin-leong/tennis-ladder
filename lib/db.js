import { Pool } from '@neondatabase/serverless';

// @neondatabase/serverless uses HTTP fetch in serverless (no TCP/SSL overhead per cold start)
// and falls back to WebSocket for transactions — drop-in replacement for pg Pool.
let pool;

if (!global._pgPool) {
  global._pgPool = new Pool({ connectionString: process.env.POSTGRES_URL });
}

pool = global._pgPool;

export default pool;
