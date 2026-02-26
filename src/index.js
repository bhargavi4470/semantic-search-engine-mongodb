import 'dotenv/config';
import app from './app.js';
import { connectDb } from './config/db.js';
import { createUserIndexes } from './schema/users.js';
import { seedAdmin } from './config/seedAdmin.js';

const PORT = Number(process.env.PORT) || 3000;

async function start() {
  await connectDb();
  await createUserIndexes();
  await seedAdmin();
  app.listen(PORT, () => {
    console.log(`Semantic search API listening on http://localhost:${PORT}`);
    console.log('  POST /ingest  - ingest documents');
    console.log('  POST /search  - semantic search (body: { query, limit?, numCandidates? })');
    console.log('  GET  /search  - semantic search (?q=...&limit=...&numCandidates=...)');
  });
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
