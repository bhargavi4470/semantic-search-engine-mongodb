import { getDb } from '../config/db.js';
import { semanticSearch } from '../services/vectorStore.js';
import { generateComprehensiveAnalysis } from '../services/explainSearch.js';
import { getExcerpt } from '../utils/excerpt.js';
import { DEFAULT_SEARCH_LIMIT } from '../config/constants.js';

const MAX_QUERY_LENGTH = 10_000;
const MAX_LIMIT = 100;
const EXCERPT_MAX_LENGTH = 300;

/**
 * POST /search
 * Body: { query: string, limit?: number, numCandidates?: number, explain?: boolean }
 *
 * GET /search?q=...&limit=...&numCandidates=...&explain=...
 *
 * Accepts a natural language query, runs vector similarity search, and returns results with:
 * - similarity score (0–1)
 * - excerpt (short snippet highlighting match context)
 * - optional AI-generated explanation per result (when explain=true)
 */
export async function handleSearch(req, res, next) {
  try {
    const query =
      req.method === 'POST'
        ? req.body?.query
        : req.query?.q;

    if (query === undefined || query === null) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Query is required. Use "query" in JSON body (POST) or "q" query param (GET).',
      });
    }

    if (typeof query !== 'string') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Query must be a string.',
      });
    }

    const trimmed = query.trim();
    if (!trimmed) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Query must not be empty.',
      });
    }

    if (trimmed.length > MAX_QUERY_LENGTH) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Query must not exceed ${MAX_QUERY_LENGTH} characters.`,
      });
    }

    const limitParam = req.body?.limit ?? req.query?.limit;
    const numCandidatesParam = req.body?.numCandidates ?? req.query?.numCandidates;
    const explainParam = req.body?.explain ?? req.query?.explain;

    const parsePositiveInt = (val, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) => {
      const n = typeof val === 'string' && val.trim() === '' ? NaN : Number.parseInt(val, 10);
      if (!Number.isFinite(n) || n < min) return min;
      return Math.min(n, max);
    };

    const limit = limitParam !== undefined && limitParam !== null
      ? parsePositiveInt(limitParam, { min: 1, max: MAX_LIMIT })
      : DEFAULT_SEARCH_LIMIT;

    let numCandidates = (numCandidatesParam !== undefined && numCandidatesParam !== null)
      ? parsePositiveInt(numCandidatesParam, { min: limit, max: 10000 })
      : undefined;

    // Ensure numCandidates is at least limit when provided
    if (typeof numCandidates === 'number' && numCandidates < limit) {
      numCandidates = limit;
    }

    const explain = explainParam === true || explainParam === 'true' || explainParam === '1';
    const userId = req.user.id;

    const results = await semanticSearch(trimmed, userId, { limit, numCandidates });

    try {
      const db = getDb();
      const searchesCollection = db.collection('searches');
      await searchesCollection.insertOne({
        query: trimmed,
        userId: userId, // Associate search with user
        resultsCount: results.length,
        createdAt: new Date()
      });
      console.log(`[SEARCH] Query: "${trimmed}" | Results above threshold: ${results.length}`);
    } catch (saveErr) {
      console.error('[HISTORY ERROR] Failed to save search history:', saveErr.message);
    }

    let finalResults = results.map(doc => ({
      _id: doc._id,
      content: doc.content,
      metadata: doc.metadata,
      similarityScore: doc.score,
      excerpt: getExcerpt(doc.content, EXCERPT_MAX_LENGTH),
    }));
    let aiContext = null;

    if (explain) {
      // Consolidated AI Analysis (Filtering, Context, and Explanations)
      const { filteredResults, aiContext: generatedContext } = await generateComprehensiveAnalysis(trimmed, results);
      aiContext = generatedContext;
      console.log(`[SEARCH] Query: "${trimmed}" | Final results after AI analysis: ${filteredResults.length}`);

      finalResults = filteredResults.map((doc) => ({
        _id: doc._id,
        content: doc.content,
        metadata: doc.metadata,
        similarityScore: doc.score,
        excerpt: getExcerpt(doc.content, EXCERPT_MAX_LENGTH),
        ...(doc.explanation && { explanation: doc.explanation }),
      }));
    }

    return res.json({
      success: true,
      query: trimmed,
      count: finalResults.length,
      results: finalResults,
      aiContext,
    });
  } catch (err) {
    next(err);
  }
}
