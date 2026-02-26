import { getDb } from '../config/db.js';
import { getEmbeddings } from './embeddings.js';
import { normalizeDocument } from '../schema/documents.js';
import {
  VECTOR_FIELD,
  DEFAULT_SEARCH_LIMIT,
  DEFAULT_NUM_CANDIDATES,
} from '../config/constants.js';

const collectionName = process.env.MONGODB_COLLECTION || 'documents';
const indexName = process.env.VECTOR_INDEX_NAME || 'vector_index';

/**
 * Get the documents collection.
 */
function getCollection() {
  return getDb().collection(collectionName);
}

/**
 * Ingest one or more documents: compute embeddings and store in MongoDB.
 * Each document must have a "content" field (string). Optional "metadata" with title, tags, source.
 * Schema: content, embedding (float[]), metadata { title, tags, source }, userId, createdAt.
 *
 * @param {Array<{ content: string, metadata?: { title?: string, tags?: string[], source?: string }>} documents
 * @param {string} userId - ID of the user owning these documents
 * @returns {Promise<{ inserted: number, ids: string[] }>}
 */
export async function ingestDocuments(documents, userId) {
  if (!Array.isArray(documents) || documents.length === 0) {
    throw new Error('documents must be a non-empty array');
  }
  if (!userId) {
    throw new Error('userId is required for ingestion');
  }

  const normalized = documents.map((doc) => {
    const { content, metadata } = normalizeDocument(doc);
    if (!content) throw new Error('Each document must have a non-empty string "content" field');
    return { content, metadata };
  });

  console.log(`[VectorStore] [User: ${userId}] Starting ingestion of ${normalized.length} documents...`);
  const contents = normalized.map((n) => n.content);
  const embeddings = await getEmbeddings(contents);

  const toInsert = normalized.map(({ content, metadata }, i) => ({
    content,
    [VECTOR_FIELD]: embeddings[i],
    metadata: metadata,
    userId: userId, // Store the owner's ID
    createdAt: new Date(),
  }));

  console.log(`[VectorStore] Inserting ${toInsert.length} documents into MongoDB...`);
  const collection = getCollection();
  const result = await collection.insertMany(toInsert);

  console.log(`[VectorStore] Successfully ingested ${result.insertedCount} documents for user ${userId}.`);

  return {
    inserted: result.insertedCount,
    ids: Object.values(result.insertedIds).map((id) => id.toString()),
  };
}

/**
 * Semantic search using MongoDB Atlas Vector Search (cosine similarity).
 *
 * @param {string} query - Search query text
 * @param {string} userId - ID of the user performing the search
 * @param {Object} options
 * @param {number} options.limit - Max documents to return (default 10)
 * @param {number} options.numCandidates - ANN candidate set size (default 100)
 * @returns {Promise<Array<{ _id: string, content: string, score: number, [key: string]: any }>>}
 */
export async function semanticSearch(query, userId, options = {}) {
  if (typeof query !== 'string' || !query.trim()) {
    throw new Error('query must be a non-empty string');
  }
  if (!userId) {
    throw new Error('userId is required for search');
  }

  const limit = Math.min(Math.max(Number(options.limit) || DEFAULT_SEARCH_LIMIT, 1), 100);
  const numCandidates = Math.min(
    Math.max(Number(options.numCandidates) || DEFAULT_NUM_CANDIDATES, limit),
    10000
  );

  const [queryEmbedding] = await getEmbeddings(query.trim());

  const collection = getCollection();

  const pipeline = [
    {
      $vectorSearch: {
        index: indexName,
        path: VECTOR_FIELD,
        queryVector: queryEmbedding,
        numCandidates,
        limit,
        filter: { userId: userId } // Isolation at vector search level
      },
    },
    {
      $project: {
        _id: 1,
        content: 1,
        metadata: 1,
        userId: 1,
        score: { $meta: 'vectorSearchScore' },
      },
    },
    {
      $match: {
        score: { $gte: 0.70 }
      }
    }
  ];

  // 1. Vector Search
  const cursor = collection.aggregate(pipeline);
  const vectorResults = await cursor.toArray();

  // 2. Keyword Search (Regex) - strictly to find exact word matches
  const keywordResults = await collection.find({
    userId, // Filter by user for keyword results too
    $or: [
      { content: { $regex: query, $options: 'i' } },
      { 'metadata.title': { $regex: query, $options: 'i' } },
      { 'metadata.tags': { $regex: query, $options: 'i' } }
    ]
  })
    .limit(10)
    .project({ _id: 1, content: 1, metadata: 1 })
    .toArray();

  // 3. Merge Results with improved weighing
  const combined = new Map();

  // Add vector results
  vectorResults.forEach(doc => {
    combined.set(doc._id.toString(), {
      ...doc,
      resultType: 'semantic',
      // Store raw semantic score for reranking
    });
  });

  // Add keyword results, boosting those that also match semantic search
  keywordResults.forEach(doc => {
    const id = doc._id.toString();
    if (!combined.has(id)) {
      // Assign a competitive score for keyword matches
      combined.set(id, { ...doc, score: 0.90, resultType: 'keyword' });
    } else {
      const existing = combined.get(id);
      // Boost hybrid matches
      combined.set(id, {
        ...existing,
        score: Math.min(1.0, existing.score + 0.05),
        resultType: 'hybrid'
      });
    }
  });

  // Sort by score
  const sortedResults = Array.from(combined.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return sortedResults.map((doc) => ({
    ...doc,
    _id: doc._id.toString(),
  }));
}
