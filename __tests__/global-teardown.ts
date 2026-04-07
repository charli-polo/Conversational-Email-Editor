import fs from 'fs';
import path from 'path';

export default async function globalTeardown() {
  const dataDir = path.join(process.cwd(), 'data');
  const filesToClean = [
    'test-template.sqlite',
    'test-template.sqlite-wal',
    'test-template.sqlite-shm',
    'test-db.sqlite',
    'test-db.sqlite-wal',
    'test-db.sqlite-shm',
  ];

  for (const file of filesToClean) {
    try {
      fs.unlinkSync(path.join(dataDir, file));
    } catch {
      // File doesn't exist — nothing to clean up
    }
  }
}
