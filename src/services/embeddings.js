import OpenAI from 'openai';
import {
  OPENAI_EMBEDDING_MODEL,
  OPENAI_EMBEDDING_DIMENSIONS,
  HF_EMBEDDING_MODEL,
  HF_EMBEDDING_DIMENSIONS,
} from '../config/constants.js';

let openaiClient = null;
let embeddingProvider = null;
let embeddingDimensions = OPENAI_EMBEDDING_DIMENSIONS;

/**
 * Initialize embedding provider: OpenAI if API key is set, else Hugging Face.
 */
function initProvider() {
  if (embeddingProvider !== null) return;

  if (process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    embeddingProvider = 'openai';
    embeddingDimensions = OPENAI_EMBEDDING_DIMENSIONS;
    return;
  }

  if (process.env.HF_API_KEY) {
    embeddingProvider = 'huggingface';
    embeddingDimensions = HF_EMBEDDING_DIMENSIONS;
    return;
  }

  throw new Error(
    'No embedding provider configured. Set OPENAI_API_KEY or HF_API_KEY in the environment.'
  );
}

/**
 * Get the current embedding dimensions (must match MongoDB vector index).
 */
export function getEmbeddingDimensions() {
  initProvider();
  return embeddingDimensions;
}

/**
 * Get embeddings for one or more texts using the configured provider.
 * @param {string | string[]} input - Single text or array of texts
 * @returns {Promise<number[][]>} Array of embedding vectors
 */
export async function getEmbeddings(input) {
  initProvider();
  const texts = Array.isArray(input) ? input : [input];

  if (embeddingProvider === 'openai') {
    return getOpenAIEmbeddings(texts);
  }
  return getHuggingFaceEmbeddings(texts);
}

async function getOpenAIEmbeddings(texts) {
  const response = await openaiClient.embeddings.create({
    model: OPENAI_EMBEDDING_MODEL,
    input: texts,
  });
  const sorted = response.data.sort((a, b) => a.index - b.index);
  return sorted.map((d) => d.embedding);
}

async function getHuggingFaceEmbeddings(texts) {
  const apiKey = process.env.HF_API_KEY;
  const model = process.env.HF_EMBEDDING_MODEL || HF_EMBEDDING_MODEL;
  const MAX_RETRIES = 3;

  console.log(`[Embeddings] Generating embeddings for ${texts.length} texts using Hugging Face (${model})...`);

  const results = [];
  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    let lastError;
    let success = false;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const start = Date.now();
        const res = await fetch(
          `https://router.huggingface.co/hf-inference/models/${model}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              inputs: text,
              options: { wait_for_model: true },
            }),
          }
        );

        if (!res.ok) {
          const err = await res.text();
          throw new Error(`Hugging Face API error: ${res.status} ${err}`);
        }

        const embedding = await res.json();
        const duration = Date.now() - start;

        console.log(`[Embeddings] [${i + 1}/${texts.length}] Processed chunk (${text.length} chars) in ${duration}ms`);

        results.push(Array.isArray(embedding) && typeof embedding[0] === 'number' ? embedding : embedding[0]);
        success = true;
        break;
      } catch (err) {
        lastError = err;
        console.warn(`[Embeddings] [${i + 1}/${texts.length}] Attempt ${attempt} failed: ${err.message}`);
        if (attempt < MAX_RETRIES) {
          const waitTime = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    if (!success) {
      throw new Error(`Failed to get embedding for text chunk ${i + 1} after ${MAX_RETRIES} attempts: ${lastError.message}`);
    }
  }

  return results;
}
