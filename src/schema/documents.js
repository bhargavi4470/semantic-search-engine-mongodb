/**
 * Document schema for the vector-backed documents collection.
 * Optimized for MongoDB Atlas Vector Search.
 *
 * @see docs/SCHEMA.md for full design and index JSON.
 */

/** Collection name (default; override via MONGODB_COLLECTION) */
export const COLLECTION_NAME = 'documents';

/** Vector field path — must match Atlas vector index "path" */
export const VECTOR_FIELD_PATH = 'embedding';

/**
 * Document shape (logical schema).
 *
 * @typedef {Object} DocumentMetadata
 * @property {string} [title] - Document title
 * @property {string[]} [tags] - Tags for filtering/display
 * @property {string} [source] - Origin (URL, file path, system name)
 *
 * @typedef {Object} VectorDocument
 * @property {import('mongodb').ObjectId} [_id] - Primary key (auto)
 * @property {string} content - Text used to generate the embedding
 * @property {number[]} embedding - Dense vector (float[]); length = index numDimensions
 * @property {DocumentMetadata} metadata - Title, tags, source
 * @property {Date} createdAt - Insert time (UTC)
 */

/**
 * Normalize incoming document for insert: ensure content and metadata shape.
 * Does not compute embedding; that is done in vectorStore.
 *
 * @param {Object} doc - Raw document from API
 * @returns {{ content: string, metadata: DocumentMetadata }}
 */
export function normalizeDocument(doc) {
  const content =
    typeof doc.content === 'string' && doc.content.trim()
      ? doc.content.trim()
      : null;

  const metadata = {
    title: typeof doc.metadata?.title === 'string' ? doc.metadata.title : undefined,
    tags: Array.isArray(doc.metadata?.tags)
      ? doc.metadata.tags.filter((t) => typeof t === 'string')
      : undefined,
    source: typeof doc.metadata?.source === 'string' ? doc.metadata.source : undefined,
  };

  if (doc.metadata && typeof doc.metadata === 'object') {
    Object.keys(doc.metadata).forEach((key) => {
      if (!['title', 'tags', 'source'].includes(key) && doc.metadata[key] !== undefined) {
        metadata[key] = doc.metadata[key];
      }
    });
  }

  return { content, metadata };
}
