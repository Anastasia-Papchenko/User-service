import { Client } from 'pg';

type EnsureDbOptions = {
  host: string;
  port?: number;
  user: string;
  password?: string;
  database: string;
  ssl?: boolean;
};

export async function ensureDatabase(opts: EnsureDbOptions) {
  const { host, port = 5432, user, password, database, ssl = false } = opts;

  const client = new Client({
    host, port, user, password,
    database: 'postgres',
    ssl: ssl ? { rejectUnauthorized: false } : undefined,
  });
  await client.connect();

  const res = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);
  if (res.rowCount === 0) {
    try {
      await client.query(`CREATE DATABASE "${database}"`);
      console.log(`🆕 Database "${database}" created`);
    } catch (e: any) {
      if (e?.code !== '42P04') throw e;
    }
  } else {
    console.log(`✅ Database "${database}" already exists`);
  }
  await client.end();
}
