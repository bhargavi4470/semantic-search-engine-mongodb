/**
 * Embedding dimensions must match the model output and the Atlas vector index.
 * OpenAI text-embedding-3-small: 1536
 * OpenAI text-embedding-ada-002: 1536
 */
export const OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small';
export const OPENAI_EMBEDDING_DIMENSIONS = 1536;

/** Hugging Face sentence-transformers fallback (dimensions depend on model) */
export const HF_EMBEDDING_MODEL = 'BAAI/bge-small-en-v1.5';
export const HF_EMBEDDING_DIMENSIONS = 384;

export const VECTOR_FIELD = 'embedding';
export const DEFAULT_SEARCH_LIMIT = 5;
export const DEFAULT_NUM_CANDIDATES = 100;
