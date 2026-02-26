/**
 * Atlas App Services HTTPS Endpoint: Semantic search (vector search).
 * Route: GET /search?q=...&limit=...  or  POST /search with body { query, limit? }
 * Auth: Application (API Key or JWT). Role required: "admin", "ingest", "search", or "user" (in user custom_data.role).
 *
 * Response: 200 { success: true, query: string, count: number, results: [ { _id, content, metadata, similarityScore } ] }
 */

const OPENAI_EMBEDDING_URL = "https://api.openai.com/v1/embeddings";
const EMBEDDING_MODEL = "text-embedding-3-small";
const VECTOR_FIELD = "embedding";
const INDEX_NAME = "vector_index";
const ALLOWED_ROLES_SEARCH = ["admin", "ingest", "search", "user"];
const DEFAULT_LIMIT = 5;
const DEFAULT_NUM_CANDIDATES = 100;

function getRole(context) {
  if (!context.user || !context.user.custom_data) return null;
  return context.user.custom_data.role || null;
}

function hasSearchAccess(context) {
  return ALLOWED_ROLES_SEARCH.includes(getRole(context));
}

async function getQueryEmbedding(context, text) {
  const apiKey = context.values.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured in App Services.");

  const response = await context.http.post({
    url: OPENAI_EMBEDDING_URL,
    headers: {
      "Content-Type": ["application/json"],
      "Authorization": ["Bearer " + apiKey],
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
    encodeBodyAsJSON: true,
  });

  if (response.statusCode !== 200) {
    const err = response.body ? response.body.text() : response.statusCode;
    throw new Error("OpenAI error: " + err);
  }
  const data = JSON.parse(response.body.text());
  const emb = data.data && data.data[0] ? data.data[0].embedding : null;
  if (!emb || !Array.isArray(emb)) throw new Error("OpenAI did not return a valid embedding.");
  return emb;
}

exports = async function (request, response) {
  response.setHeader("Content-Type", "application/json");

  try {
    if (!context.user) {
      response.setStatusCode(401);
      response.setBody(JSON.stringify({ error: "Unauthorized", message: "Authentication required." }));
      return;
    }
    if (!hasSearchAccess(context)) {
      response.setStatusCode(403);
      response.setBody(JSON.stringify({ error: "Forbidden", message: "Your role does not have search access." }));
      return;
    }

    let query = "";
    let limit = DEFAULT_LIMIT;
    if (request.httpMethod === "GET") {
      query = (request.query && request.query.q) ? request.query.q : "";
      const l = request.query && request.query.limit;
      if (l != null) limit = Math.min(Math.max(parseInt(l, 10) || DEFAULT_LIMIT, 1), 100);
    } else {
      const body = request.body ? JSON.parse(request.body.text()) : {};
      query = body.query != null ? String(body.query).trim() : (body.q != null ? String(body.q).trim() : "");
      const l = body.limit != null ? body.limit : request.query && request.query.limit;
      if (l != null) limit = Math.min(Math.max(parseInt(l, 10) || DEFAULT_LIMIT, 1), 100);
    }

    if (!query) {
      response.setStatusCode(400);
      response.setBody(JSON.stringify({ error: "Validation Error", message: "query (or q) is required." }));
      return;
    }

    const queryVector = await getQueryEmbedding(context, query);
    const numCandidates = Math.max(DEFAULT_NUM_CANDIDATES, limit);

    const dbName = context.environment.values.DB_NAME || "semantic_search";
    const collName = context.environment.values.COLLECTION_NAME || "documents";
    const mdb = context.services.get("mongodb-atlas");
    const collection = mdb.db(dbName).collection(collName);

    const pipeline = [
      {
        $vectorSearch: {
          index: context.environment.values.VECTOR_INDEX_NAME || INDEX_NAME,
          path: VECTOR_FIELD,
          queryVector,
          numCandidates,
          limit,
        },
      },
      {
        $project: {
          _id: 1,
          content: 1,
          metadata: 1,
          score: { $meta: "vectorSearchScore" },
          [VECTOR_FIELD]: 0,
        },
      },
    ];

    const cursor = await collection.aggregate(pipeline);
    const results = await cursor.toArray();

    const formatted = results.map((doc) => ({
      _id: doc._id.toString(),
      content: doc.content,
      metadata: doc.metadata,
      similarityScore: doc.score,
    }));

    response.setStatusCode(200);
    response.setBody(JSON.stringify({
      success: true,
      query,
      count: formatted.length,
      results: formatted,
    }));
  } catch (err) {
    response.setStatusCode(500);
    response.setBody(JSON.stringify({ error: "Internal Error", message: err.message || "Search failed." }));
  }
};
