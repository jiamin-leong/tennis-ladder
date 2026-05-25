import { Pool } from 'pg';

// Reuse the pool across hot-reloads in development
let pool;

if (!global._pgPool) {
  global._pgPool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 10,
  });
}

pool = global._pgPool;

export default pool;
