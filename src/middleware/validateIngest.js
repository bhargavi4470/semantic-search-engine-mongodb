/**
 * Validation for POST /ingest request body.
 * Returns null if valid, or an error object { statusCode, error, message, details? }.
 */

const MAX_DOCUMENTS = 500;
const MAX_CONTENT_LENGTH = 50_000_000;
const MAX_METADATA_TITLE_LENGTH = 500;
const MAX_METADATA_SOURCE_LENGTH = 2000;
const MAX_TAGS = 50;
const MAX_TAG_LENGTH = 100;

/**
 * Heuristic to detect binary/non-text content.
 * Checks for a high density of non-printable or control characters.
 */
function isBinaryLike(text) {
  if (text.length < 50) return false; // Too short to judge accurately

  let nonPrintableCount = 0;
  const sampleSize = Math.min(text.length, 2000);

  for (let i = 0; i < sampleSize; i++) {
    const charCode = text.charCodeAt(i);
    // Control characters (excluding \n, \r, \t) and non-printable
    if (charCode < 32 && ![9, 10, 13].includes(charCode)) {
      nonPrintableCount++;
    }
  }

  // If more than 10% of characters are non-printable, it's likely binary
  return (nonPrintableCount / sampleSize) > 0.1;
}

/**
 * Validate a single document for ingest.
 * @param {unknown} doc
 * @param {number} index
 * @returns {{ valid: true } | { valid: false, message: string, field?: string }}
 */
function validateDocument(doc, index) {
  if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) {
    return { valid: false, message: `documents[${index}] must be an object`, field: 'documents' };
  }

  const content = doc.content;
  if (content === undefined || content === null) {
    return { valid: false, message: `documents[${index}].content is required`, field: 'content' };
  }
  if (typeof content !== 'string') {
    return { valid: false, message: `documents[${index}].content must be a string`, field: 'content' };
  }
  if (!content.trim()) {
    return { valid: false, message: `documents[${index}].content must not be empty`, field: 'content' };
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    return {
      valid: false,
      message: `documents[${index}].content exceeds maximum length (${MAX_CONTENT_LENGTH} characters)`,
      field: 'content',
    };
  }

  // Sanity check: prevent indexing binary data (high ratio of non-printable characters)
  if (isBinaryLike(content)) {
    return {
      valid: false,
      message: `documents[${index}].content appears to be binary or non-textual data.`,
      field: 'content',
    };
  }

  const meta = doc.metadata;
  if (meta !== undefined && meta !== null) {
    if (typeof meta !== 'object' || Array.isArray(meta)) {
      return { valid: false, message: `documents[${index}].metadata must be an object`, field: 'metadata' };
    }
    if (meta.title !== undefined && meta.title !== null) {
      if (typeof meta.title !== 'string') {
        return { valid: false, message: `documents[${index}].metadata.title must be a string`, field: 'metadata.title' };
      }
      if (meta.title.length > MAX_METADATA_TITLE_LENGTH) {
        return {
          valid: false,
          message: `documents[${index}].metadata.title exceeds maximum length (${MAX_METADATA_TITLE_LENGTH})`,
          field: 'metadata.title',
        };
      }
    }
    if (meta.source !== undefined && meta.source !== null) {
      if (typeof meta.source !== 'string') {
        return { valid: false, message: `documents[${index}].metadata.source must be a string`, field: 'metadata.source' };
      }
      if (meta.source.length > MAX_METADATA_SOURCE_LENGTH) {
        return {
          valid: false,
          message: `documents[${index}].metadata.source exceeds maximum length (${MAX_METADATA_SOURCE_LENGTH})`,
          field: 'metadata.source',
        };
      }
    }
    if (meta.tags !== undefined && meta.tags !== null) {
      if (!Array.isArray(meta.tags)) {
        return { valid: false, message: `documents[${index}].metadata.tags must be an array`, field: 'metadata.tags' };
      }
      if (meta.tags.length > MAX_TAGS) {
        return {
          valid: false,
          message: `documents[${index}].metadata.tags must not exceed ${MAX_TAGS} items`,
          field: 'metadata.tags',
        };
      }
      for (let i = 0; i < meta.tags.length; i++) {
        if (typeof meta.tags[i] !== 'string') {
          return { valid: false, message: `documents[${index}].metadata.tags[${i}] must be a string`, field: 'metadata.tags' };
        }
        if (meta.tags[i].length > MAX_TAG_LENGTH) {
          return {
            valid: false,
            message: `documents[${index}].metadata.tags[${i}] exceeds maximum length (${MAX_TAG_LENGTH})`,
            field: 'metadata.tags',
          };
        }
      }
    }
  }

  return { valid: true };
}

/**
 * Validate POST /ingest request body.
 *
 * @param {unknown} body - req.body
 * @returns {null | { statusCode: number, error: string, message: string, details?: unknown }}
 */
export function validateIngestBody(body) {
  if (body === null || body === undefined) {
    return {
      statusCode: 400,
      error: 'Bad Request',
      message: 'Request body is required and must be JSON.',
    };
  }
  if (typeof body !== 'object' || Array.isArray(body)) {
    return {
      statusCode: 400,
      error: 'Bad Request',
      message: 'Request body must be a JSON object.',
    };
  }

  const documents = body.documents;
  if (documents === undefined) {
    return {
      statusCode: 400,
      error: 'Validation Error',
      message: 'Request body must include a "documents" array.',
    };
  }
  if (!Array.isArray(documents)) {
    return {
      statusCode: 400,
      error: 'Validation Error',
      message: '"documents" must be an array.',
    };
  }
  if (documents.length === 0) {
    return {
      statusCode: 400,
      error: 'Validation Error',
      message: '"documents" must contain at least one document.',
    };
  }
  if (documents.length > MAX_DOCUMENTS) {
    return {
      statusCode: 400,
      error: 'Validation Error',
      message: `"documents" must not exceed ${MAX_DOCUMENTS} items per request.`,
    };
  }

  for (let i = 0; i < documents.length; i++) {
    const result = validateDocument(documents[i], i);
    if (!result.valid) {
      return {
        statusCode: 400,
        error: 'Validation Error',
        message: result.message,
        details: result.field ? { field: result.field } : undefined,
      };
    }
  }

  return null;
}
