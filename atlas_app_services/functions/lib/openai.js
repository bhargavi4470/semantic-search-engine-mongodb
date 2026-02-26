/**
 * Call OpenAI Embeddings API from Atlas App Services.
 * Store OPENAI_API_KEY in App Services Secrets and reference via a Value named "OPENAI_API_KEY".
 */

const OPENAI_EMBEDDING_URL = "https://api.openai.com/v1/embeddings";
const MODEL = "text-embedding-3-small";

async function getEmbedding(context, text) {
  const apiKey = context.values.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured in App Services values/secrets.");
  }

  const response = await context.http.post({
    url: OPENAI_EMBEDDING_URL,
    headers: {
      "Content-Type": ["application/json"],
      "Authorization": ["Bearer " + apiKey],
    },
    body: JSON.stringify({
      model: MODEL,
      input: typeof text === "string" ? text : text,
    }),
    encodeBodyAsJSON: true,
  });

  if (response.statusCode !== 200) {
    const errBody = response.body ? response.body.text() : "";
    throw new Error("OpenAI API error: " + response.statusCode + " " + errBody);
  }

  const data = JSON.parse(response.body.text());
  const embedding = data.data && data.data[0] ? data.data[0].embedding : null;
  if (!embedding || !Array.isArray(embedding)) {
    throw new Error("OpenAI API did not return a valid embedding.");
  }
  return embedding;
}

async function getEmbeddings(context, texts) {
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error("texts must be a non-empty array");
  }

  const apiKey = context.values.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured in App Services values/secrets.");
  }

  const response = await context.http.post({
    url: OPENAI_EMBEDDING_URL,
    headers: {
      "Content-Type": ["application/json"],
      "Authorization": ["Bearer " + apiKey],
    },
    body: JSON.stringify({
      model: MODEL,
      input: texts,
    }),
    encodeBodyAsJSON: true,
  });

  if (response.statusCode !== 200) {
    const errBody = response.body ? response.body.text() : "";
    throw new Error("OpenAI API error: " + response.statusCode + " " + errBody);
  }

  const data = JSON.parse(response.body.text());
  const sorted = (data.data || []).sort((a, b) => (a.index || 0) - (b.index || 0));
  return sorted.map((d) => d.embedding).filter(Boolean);
}

exports.getEmbedding = getEmbedding;
exports.getEmbeddings = getEmbeddings;
