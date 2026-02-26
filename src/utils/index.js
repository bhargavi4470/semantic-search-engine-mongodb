/**
 * Re-export utilities for clean imports.
 * e.g. import { embed, embedOne, normalizeVector, EmbeddingError } from './utils/index.js';
 */

export {
  embed,
  embedOne,
  normalizeVector,
  normalizeVectors,
  EmbeddingError,
} from './openai-embeddings.js';
