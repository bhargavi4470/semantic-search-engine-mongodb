import { ingestDocuments } from '../services/vectorStore.js';
import { validateIngestBody } from '../middleware/validateIngest.js';

/**
 * POST /ingest
 *
 * Accepts JSON body: { documents: Array<{ content: string, metadata?: { title?, tags?, source? } }> }
 * - Validates request body and each document.
 * - Generates embeddings for each document's content.
 * - Stores documents with embeddings in MongoDB.
 * - Returns success response with inserted count and ids.
 */
export async function handleIngest(req, res, next) {
  try {
    const validationError = validateIngestBody(req.body);
    if (validationError) {
      return res.status(validationError.statusCode).json({
        error: validationError.error,
        message: validationError.message,
        ...(validationError.details && { details: validationError.details }),
      });
    }

    const { documents } = req.body;
    const userId = req.user.id;
    const result = await ingestDocuments(documents, userId);

    return res.status(201).json({
      success: true,
      message: 'Documents ingested successfully',
      data: {
        inserted: result.inserted,
        ids: result.ids,
      },
    });
  } catch (err) {
    next(err);
  }
}
