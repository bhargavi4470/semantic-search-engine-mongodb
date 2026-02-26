/**
 * Modular OpenAI embeddings utility.
 * - Accepts text input (string or string[]).
 * - Generates embeddings via OpenAI API.
 * - Handles API errors gracefully.
 * - Returns L2-normalized vectors (unit length) for cosine similarity via dot product.
 *
 * Uses OPENAI_API_KEY from env by default; can override via options.apiKey.
 */

import OpenAI from 'openai';

const DEFAULT_MODEL = 'text-embedding-3-small';

/**
 * Custom error for embedding failures; preserves cause and a stable code.
 */
export class EmbeddingError extends Error {
  /**
   * @param {string} message
   * @param {{ code?: string, status?: number, cause?: Error }} options
   */
  constructor(message, { code = 'EMBEDDING_ERROR', status, cause } = {}) {
    super(message);
    this.name = 'EmbeddingError';
    this.code = code;
    this.status = status;
    this.cause = cause;
  }
}

/**
 * L2-normalize a single vector in place (unit length).
 * Zero vector is returned unchanged to avoid NaN.
 *
 * @param {number[]} vector - Mutable array of numbers
 * @returns {number[]} The same array, normalized
 */
export function normalizeVector(vector) {
  const len = Math.hypot(...vector);
  if (len === 0) return vector;
  for (let i = 0; i < vector.length; i++) {
    vector[i] /= len;
  }
  return vector;
}

/**
 * L2-normalize multiple vectors (copy; does not mutate input).
 *
 * @param {number[][]} vectors - Array of embedding vectors
 * @returns {number[][]} New array of normalized vectors
 */
export function normalizeVectors(vectors) {
  return vectors.map((v) => normalizeVector([...v]));
}

/**
 * Create an OpenAI client (or use provided one).
 * @param {string} [apiKey] - Overrides OPENAI_API_KEY
 * @returns {OpenAI}
 */
function getClient(apiKey) {
  const key = apiKey ?? process.env.OPENAI_API_KEY;
  if (!key || typeof key !== 'string') {
    throw new EmbeddingError('OpenAI API key is required. Set OPENAI_API_KEY or pass options.apiKey.', {
      code: 'MISSING_API_KEY',
    });
  }
  return new OpenAI({ apiKey: key });
}

/**
 * Map OpenAI API errors to user-friendly EmbeddingError with code and status.
 *
 * @param {Error} err
 * @returns {EmbeddingError}
 */
function toEmbeddingError(err) {
  if (err instanceof EmbeddingError) return err;

  const openaiError = /** @type {{
    status?: number;
    code?: string;
    message?: string;
    error?: { message?: string; code?: string };
  }} */ (err);

  const status = openaiError.status;
  const message = openaiError.message ?? openaiError.error?.message ?? String(err);

  if (openaiError.status === 401) {
    return new EmbeddingError('Invalid or missing OpenAI API key.', {
      code: 'AUTH_ERROR',
      status: 401,
      cause: err,
    });
  }
  if (openaiError.status === 429) {
    return new EmbeddingError('OpenAI rate limit exceeded. Retry after a short delay.', {
      code: 'RATE_LIMIT',
      status: 429,
      cause: err,
    });
  }
  if (openaiError.status === 400) {
    return new EmbeddingError(`OpenAI invalid request: ${message}`, {
      code: 'BAD_REQUEST',
      status: 400,
      cause: err,
    });
  }
  if (openaiError.status === 500 || openaiError.status === 502 || openaiError.status === 503) {
    return new EmbeddingError(`OpenAI server error (${openaiError.status}). Retry later.`, {
      code: 'SERVER_ERROR',
      status: openaiError.status,
      cause: err,
    });
  }

  return new EmbeddingError(message, {
    code: 'API_ERROR',
    status: openaiError.status,
    cause: err,
  });
}

/**
 * Generate embeddings for one or more texts using the OpenAI API, then L2-normalize.
 * Single text can be passed as string; returns always an array of vectors.
 *
 * @param {string | string[]} input - Single text or array of texts
 * @param {Object} [options]
 * @param {string} [options.apiKey] - OpenAI API key (default: process.env.OPENAI_API_KEY)
 * @param {string} [options.model] - Model name (default: text-embedding-3-small)
 * @param {boolean} [options.normalize=true] - Whether to L2-normalize vectors (default true)
 * @returns {Promise<number[][]>} Array of embedding vectors (normalized by default)
 * @throws {EmbeddingError} On missing key, invalid input, or API errors
 */
export async function embed(input, options = {}) {
  const { apiKey, model = DEFAULT_MODEL, normalize = true } = options;

  const texts = Array.isArray(input) ? input : [input];
  if (texts.length === 0) {
    throw new EmbeddingError('At least one text input is required.', { code: 'EMPTY_INPUT' });
  }

  for (let i = 0; i < texts.length; i++) {
    if (typeof texts[i] !== 'string') {
      throw new EmbeddingError(`Input at index ${i} must be a string.`, { code: 'INVALID_INPUT' });
    }
    if (!texts[i].trim()) {
      throw new EmbeddingError(`Input at index ${i} must not be empty.`, { code: 'EMPTY_INPUT' });
    }
  }

  const client = getClient(apiKey);

  let rawVectors;
  try {
    const response = await client.embeddings.create({
      model,
      input: texts.map((t) => t.trim()),
    });
    const sorted = response.data.sort((a, b) => a.index - b.index);
    rawVectors = sorted.map((d) => d.embedding);
  } catch (err) {
    throw toEmbeddingError(err);
  }

  return normalize ? normalizeVectors(rawVectors) : rawVectors;
}

/**
 * Single-text convenience: returns one normalized vector.
 *
 * @param {string} text - Input text
 * @param {Object} [options] - Same as embed()
 * @returns {Promise<number[]>} Single normalized embedding vector
 */
export async function embedOne(text, options = {}) {
  const [vector] = await embed(text, options);
  return vector;
}
