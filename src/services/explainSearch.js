/**
 * Generate short AI explanations for why each search result matches the query.
 * Uses OpenAI Chat API; requires OPENAI_API_KEY. Returns null explanations when disabled or on error.
 */

import OpenAI from 'openai';

const EXPLAIN_MODEL = 'gpt-4o-mini';
const MAX_CONTENT_FOR_PROMPT = 400;

function getClient() {
  const key = process.env.OPENAI_API_KEY;
  if (!key || typeof key !== 'string') return null;
  return new OpenAI({ apiKey: key });
}

/**
 * Truncate content for the prompt to limit tokens.
 */
function truncateForPrompt(text) {
  if (typeof text !== 'string') return '';
  return text.trim().slice(0, MAX_CONTENT_FOR_PROMPT) + (text.length > MAX_CONTENT_FOR_PROMPT ? '...' : '');
}

/**
 * Generate one short explanation per result (why this document matches the query).
 * Returns an array of strings (same length as results); null entries on failure or when OpenAI is unavailable.
 *
 * @param {string} query - User search query
 * @param {Array<{ content: string, [key: string]: any }>} results - Search results with content
 * @returns {Promise<(string | null)[]>}
 */
export async function generateExplanations(query, results) {
  if (!query?.trim() || !Array.isArray(results) || results.length === 0) {
    return results.map(() => null);
  }

  const client = getClient();
  const systemPrompt = `You are an expert search analysis assistant. 
Review the provided document snippets (numbered) and explain why they are relevant to the user's query. 
For each document, provide a 2-3 sentence analysis that highlights:
1. The core conceptual overlap between the document and the query.
2. Specific insights or details within the document that satisfy the user's intent.
3. How this document adds value to the search topic.
Be analytical, objective, and clear. Output ONLY a JSON array of strings.`;
  const documentsForPrompt = results
    .map((r, i) => `[${i + 1}] ${truncateForPrompt(r.content)}`)
    .join('\n\n');
  const userPrompt = `Query: "${query.trim()}"\n\nDocuments:\n${documentsForPrompt}\n\nJSON array of ${results.length} detailed explanations (one per document):`;

  if (client) {
    try {
      const completion = await client.chat.completions.create({
        model: EXPLAIN_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 150 * results.length,
        temperature: 0.3,
      });

      const raw = completion.choices?.[0]?.message?.content?.trim();
      return parseJsonResponse(raw, results.length);
    } catch (err) {
      console.error('[AI] OpenAI Explanation Error:', err.message);
    }
  }

  // Fallback to Hugging Face
  const hfKey = process.env.HF_API_KEY;
  if (hfKey) {
    try {
      const model = 'mistralai/Mistral-7B-Instruct-v0.2';
      const res = await fetch(`https://router.huggingface.co/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 512,
          temperature: 0.3
        })
      });

      if (res.ok) {
        const json = await res.json();
        console.log('[AI] Full API Response:', JSON.stringify(json));
        const raw = json.choices?.[0]?.message?.content?.trim();
        console.log('[AI] Raw content from HF:', raw);
        console.log(`[AI] Successfully generated ${results.length} explanations using Hugging Face.`);
        return parseJsonResponse(raw, results.length);
      } else {
        const errText = await res.text();
        console.error(`[AI] HF API Error: ${res.status} - ${errText}`);
      }
    } catch (err) {
      console.error('[AI] Hugging Face Explanation Error:', err.message);
    }
  } else {
    console.warn('[AI] No HF_API_KEY or OPENAI_API_KEY found.');
  }

  return results.map(() => null);
}

function parseJsonResponse(raw, expectedLength) {
  if (!raw) return Array(expectedLength).fill(null);
  try {
    const content = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) return Array(expectedLength).fill(null);
    return Array(expectedLength).fill(null).map((_, i) => {
      const val = parsed[i];
      if (typeof val === 'string') return val.trim();
      if (typeof val === 'object' && val !== null && val.explanation) return val.explanation.trim();
      return null;
    });
  } catch (err) {
    console.warn('[AI] JSON Parsing Failed. Raw Response:', raw);
    console.error('[AI] Parsing Error:', err.message);
    return Array(expectedLength).fill(null);
  }
}

/**
 * Generate a concise context/definition for the search query itself.
 *
 * @param {string} query
 * @returns {Promise<string|null>}
 */
export async function generateSearchContext(query) {
  if (!query?.trim()) return null;

  const client = getClient();
  const systemPrompt = `You are a strategic search analyst. 
Provide a concise but insightful definition and high-level analysis (2-3 sentences) of the user's search query. 
Explain what the term means in a professional context and why someone might be searching for it in a knowledge base. 
Focus on providing actionable context for the searcher.`;
  const userPrompt = `Define or explain: "${query.trim()}"`;

  try {
    if (client) {
      const completion = await client.chat.completions.create({
        model: EXPLAIN_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 100,
        temperature: 0.3,
      });
      return completion.choices?.[0]?.message?.content?.trim() || null;
    }

    // Fallback to Hugging Face
    const hfKey = process.env.HF_API_KEY;
    if (hfKey) {
      const model = 'mistralai/Mistral-7B-Instruct-v0.2';
      const res = await fetch(`https://router.huggingface.co/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 100,
          temperature: 0.3
        })
      });

      if (res.ok) {
        const json = await res.json();
        return json.choices?.[0]?.message?.content?.trim() || null;
      } else {
        console.error(`[AI] HF Context Error: ${res.status}`);
      }
    }
  } catch (err) {
    console.error('[AI] Search Context Error:', err.message);
  }
  return null;
}
/**
 * Generate a comprehensive analysis including filtering, context, and explanations in a single LLM call.
 * This significantly reduces search latency by eliminating multiple round trips.
 *
 * @param {string} query
 * @param {Array} results
 * @returns {Promise<{ filteredResults: Array, aiContext: string|null }>}
 */
export async function generateComprehensiveAnalysis(query, results) {
  if (!query?.trim() || !Array.isArray(results) || results.length === 0) {
    return { filteredResults: results, aiContext: null };
  }

  const client = getClient();
  const hfKey = process.env.HF_API_KEY;

  const systemPrompt = `You are an AI Strategy Agent specializing in semantic search analysis. 
Your task is to analyze search results for the given query and provide a structured JSON response from the perspective of an expert agent.

STRICT JSON FORMAT:
{
  "searchContext": "A concise 2-3 sentence strategic analysis of the search term from an AI agent's perspective.",
  "analysis": [
    {
      "relevant": boolean,
      "explanation": "A 2-sentence explanation of why this document matches (or null if irrelevant), provided by the agent."
    }
  ]
}

RELEVANCE CRITERIA:
Only mark "relevant": true if the document is conceptually or factually related to the query. 
Be strict to ensure high-quality matches.

ANALYSIS CRITERIA:
Explanations should highlight core conceptual overlap and specific value, written in a professional agentic tone.`;

  const documentsForPrompt = results
    .map((r, i) => `[${i + 1}] Title: ${r.metadata?.title || 'Unknown'}\nContent: ${truncateForPrompt(r.content)}`)
    .join('\n\n');
  const userPrompt = `Query: "${query.trim()}"\n\nDocuments:\n${documentsForPrompt}\n\nReturn JSON object:`;

  try {
    let raw = null;
    if (client) {
      const completion = await client.chat.completions.create({
        model: EXPLAIN_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      });
      raw = completion.choices?.[0]?.message?.content?.trim();
    } else if (hfKey) {
      const model = 'mistralai/Mistral-7B-Instruct-v0.2';
      const res = await fetch(`https://router.huggingface.co/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.2
        })
      });
      if (res.ok) {
        const json = await res.json();
        raw = json.choices?.[0]?.message?.content?.trim();
      }
    }

    if (raw) {
      const content = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(content);

      const filteredResults = results
        .map((res, i) => {
          const item = parsed.analysis?.[i];
          if (item && item.relevant) {
            return {
              ...res,
              explanation: item.explanation
            };
          }
          return null;
        })
        .filter(Boolean);

      return {
        filteredResults,
        aiContext: parsed.searchContext || null
      };
    }
  } catch (err) {
    console.error('[AI] Comprehensive Analysis Error:', err.message);
  }

  // Fallback: return raw results without AI enhancements
  return { filteredResults: results, aiContext: null };
}
