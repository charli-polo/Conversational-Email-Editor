import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

export default async function globalSetup() {
  const templatePath = path.join(process.cwd(), 'data', 'test-template.sqlite');
  const testDbPath = path.join(process.cwd(), 'data', 'test-db.sqlite');

  // Ensure data directory exists
  const dataDir = path.dirname(templatePath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Remove old template if it exists
  if (fs.existsSync(templatePath)) fs.unlinkSync(templatePath);

  // Create a fresh template DB with all migrations applied
  const sqlite = new Database(templatePath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  const db = drizzle(sqlite);
  migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') });
  sqlite.close();

  // Copy template to test DB path
  fs.copyFileSync(templatePath, testDbPath);

  // Remove WAL/SHM files if they exist from prior runs
  for (const ext of ['-wal', '-shm']) {
    const f = testDbPath + ext;
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
}
