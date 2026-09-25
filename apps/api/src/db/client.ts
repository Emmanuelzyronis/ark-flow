import { Pool } from '@neondatabase/serverless';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = {
  query: <T = Record<string, unknown>>(text: string, params?: unknown[]) =>
    pool.query<T>(text, params),
};

export default db;
