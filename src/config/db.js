import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DATABASE || 'semantic_search';

if (!uri) {
  throw new Error('MONGODB_URI environment variable is required');
}

let client = null;
let db = null;

/**
 * Connect to MongoDB Atlas and return the database instance.
 * Uses connection pooling; safe to call multiple times.
 */
export async function connectDb() {
  if (db) return db;
  client = new MongoClient(uri, {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 10000,
  });
  await client.connect();
  db = client.db(dbName);
  return db;
}

/**
 * Get the current database instance. Throws if not connected.
 */
export function getDb() {
  if (!db) throw new Error('Database not connected. Call connectDb() first.');
  return db;
}

/**
 * Close the MongoDB connection.
 */
export async function closeDb() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
