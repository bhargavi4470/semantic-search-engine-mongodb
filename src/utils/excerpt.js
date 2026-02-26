/**
 * Build a short excerpt from document content to highlight match context.
 */

const DEFAULT_MAX_LENGTH = 300;
const SENTENCE_END = /[.!?]\s+/g;

/**
 * Get a short excerpt from content (first N chars, ideally ending at a sentence boundary).
 *
 * @param {string} content - Full document content
 * @param {number} [maxLength=300] - Max characters
 * @returns {string} Excerpt, with "..." if truncated
 */
export function getExcerpt(content, maxLength = DEFAULT_MAX_LENGTH) {
  if (typeof content !== 'string' || !content.trim()) {
    return '';
  }
  const trimmed = content.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  const slice = trimmed.slice(0, maxLength);
  let lastEnd = -1;
  let m;
  SENTENCE_END.lastIndex = 0;
  while ((m = SENTENCE_END.exec(slice)) !== null) {
    lastEnd = m.index + m[0].length;
  }
  const end = lastEnd > 0 ? lastEnd : slice.length;
  const excerpt = slice.slice(0, end).trim();
  return excerpt ? `${excerpt}...` : `${slice.trim()}...`;
}
