/**
 * Atlas App Services HTTPS Endpoint: Document ingestion.
 * Route: POST /ingest
 * Auth: Application (API Key or JWT). Role required: "admin" or "ingest" (in user custom_data.role).
 *
 * Body: { documents: [ { content: string, metadata?: { title?, tags?, source? } } ] }
 * Response: 201 { success: true, inserted: number, ids: string[] }
 */

const OPENAI_EMBEDDING_URL = "https://api.openai.com/v1/embeddings";
const EMBEDDING_MODEL = "text-embedding-3-small";
const VECTOR_FIELD = "embedding";
const ALLOWED_ROLES_INGEST = ["admin", "ingest"];

function getRole(context) {
  if (!context.user || !context.user.custom_data) return null;
  return context.user.custom_data.role || null;
}

function hasIngestAccess(context) {
  return ALLOWED_ROLES_INGEST.includes(getRole(context));
}

async function getEmbeddings(context, texts) {
  const apiKey = context.values.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured in App Services.");

  const response = await context.http.post({
    url: OPENAI_EMBEDDING_URL,
    headers: {
      "Content-Type": ["application/json"],
      "Authorization": ["Bearer " + apiKey],
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts }),
    encodeBodyAsJSON: true,
  });

  if (response.statusCode !== 200) {
    const err = response.body ? response.body.text() : response.statusCode;
    throw new Error("OpenAI error: " + err);
  }
  const data = JSON.parse(response.body.text());
  const sorted = (data.data || []).sort((a, b) => (a.index || 0) - (b.index || 0));
  return sorted.map((d) => d.embedding).filter(Boolean);
}

exports = async function (request, response) {
  response.setHeader("Content-Type", "application/json");

  try {
    if (!context.user) {
      response.setStatusCode(401);
      response.setBody(JSON.stringify({ error: "Unauthorized", message: "Authentication required." }));
      return;
    }
    if (!hasIngestAccess(context)) {
      response.setStatusCode(403);
      response.setBody(JSON.stringify({ error: "Forbidden", message: "Your role does not have ingest access." }));
      return;
    }

    const body = request.body ? JSON.parse(request.body.text()) : {};
    const documents = body.documents;
    if (!Array.isArray(documents) || documents.length === 0) {
      response.setStatusCode(400);
      response.setBody(JSON.stringify({ error: "Validation Error", message: "documents must be a non-empty array." }));
      return;
    }

    const dbName = context.environment.values.DB_NAME || "semantic_search";
    const collName = context.environment.values.COLLECTION_NAME || "documents";
    const mdb = context.services.get("mongodb-atlas");
    const collection = mdb.db(dbName).collection(collName);

    const contents = [];
    const metadatas = [];
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const content = typeof doc.content === "string" ? doc.content.trim() : "";
      if (!content) {
        response.setStatusCode(400);
        response.setBody(JSON.stringify({ error: "Validation Error", message: "documents[" + i + "].content is required and must be non-empty." }));
        return;
      }
      contents.push(content);
      const meta = doc.metadata && typeof doc.metadata === "object" ? doc.metadata : {};
      metadatas.push({
        title: typeof meta.title === "string" ? meta.title : undefined,
        tags: Array.isArray(meta.tags) ? meta.tags.filter((t) => typeof t === "string") : undefined,
        source: typeof meta.source === "string" ? meta.source : undefined,
      });
    }

    const embeddings = await getEmbeddings(context, contents);
    const toInsert = contents.map((content, i) => ({
      content,
      [VECTOR_FIELD]: embeddings[i],
      metadata: metadatas[i],
      createdAt: new Date(),
    }));

    const result = await collection.insertMany(toInsert);
    const ids = Object.values(result.insertedIds).map((id) => id.toString());

    response.setStatusCode(201);
    response.setBody(JSON.stringify({
      success: true,
      message: "Documents ingested successfully",
      data: { inserted: result.insertedCount, ids },
    }));
  } catch (err) {
    response.setStatusCode(500);
    response.setBody(JSON.stringify({ error: "Internal Error", message: err.message || "Ingest failed." }));
  }
};
