# MongoDB Schema: Documents with Vector Embeddings

Schema for storing text documents with vector embeddings, optimized for **MongoDB Atlas Vector Search**.

---

## Document shape

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | (auto) | Primary key. |
| `content` | string | ✓ | Raw text used to generate the embedding. Indexed only for application use; not in the vector index. |
| `embedding` | float[] | ✓ | Dense vector from the embedding model. **Must match index dimensions** (e.g. 1536 for OpenAI). Used by Atlas Vector Search. |
| `metadata` | object | ✓ | Structured metadata. |
| `metadata.title` | string | | Document title. |
| `metadata.tags` | string[] | | Tags for filtering or display. |
| `metadata.source` | string | | Origin (e.g. URL, file path, system name). |
| `createdAt` | Date | ✓ | Insert time (UTC). |

Additional top-level or `metadata` fields are allowed (e.g. `updatedAt`, `metadata.author`). Only fields that need to be used in **vector search filters** should be added to the Atlas index definition (see below).

---

## BSON / JSON example

```json
{
  "_id": ObjectId("..."),
  "content": "MongoDB Atlas Vector Search enables semantic search over your data using dense vector embeddings and cosine similarity.",
  "embedding": [0.012, -0.034, 0.056, ...],
  "metadata": {
    "title": "Atlas Vector Search Overview",
    "tags": ["mongodb", "vector-search", "atlas"],
    "source": "https://docs.mongodb.com/atlas/vector-search"
  },
  "createdAt": ISODate("2025-01-30T12:00:00.000Z")
}
```

- `embedding`: array of **double** (BSON) / float in JSON; length = model dimension (e.g. 1536). Do not store non-numeric or nested values.

---

## Design notes (Atlas Vector Search)

1. **Single vector field**  
   One field, `embedding`, holds the vector. Atlas Vector Search indexes one (or more) vector paths per index; this schema uses one path for simplicity and best performance.

2. **Flat vector array**  
   `embedding` is a top-level array of numbers. Atlas supports only numeric arrays for vector type; no nested arrays or objects.

3. **Metadata separate from vector**  
   `metadata` is not part of the vector index. Add `metadata` (or subfields) to the index only if you need **pre-filters** (e.g. `metadata.source`, `metadata.tags`). Pre-filter fields must be indexed as type `filter` in the same Atlas Search index.

4. **No storedSource on vector**  
   For indexes that include a vector field, do not set `storedSource: true` for the whole index; use `include`/`exclude` if you need to control what is stored in the search index.

5. **Dimensions**  
   Index `numDimensions` must equal the length of `embedding` (e.g. 1536 for OpenAI `text-embedding-3-small`).

---

## Atlas Vector Search index (cosine similarity)

Create this index in **Atlas → Search → Create Search Index → JSON Editor**.

- **Database / Collection:** same as your app (e.g. `semantic_search` / `documents`).
- **Index name:** e.g. `vector_index` (must match `VECTOR_INDEX_NAME` in the app).

### Index: vector only (no pre-filters)

Use when you do **not** filter by metadata in the `$vectorSearch` stage:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    }
  ]
}
```

- **numDimensions:** must match your embedding model (1536 for OpenAI; 384 for e.g. `all-MiniLM-L6-v2`).
- **similarity:** `"cosine"` for cosine similarity.

---

### Index: vector + metadata filters (optional)

Use when you want to **pre-filter** by `metadata.source` or `metadata.tags` in `$vectorSearch` (e.g. filter by source or tag before running vector search):

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "metadata.source"
    },
    {
      "type": "filter",
      "path": "metadata.tags"
    }
  ]
}
```

Then you can pass a `filter` in the `$vectorSearch` stage, for example:

```javascript
$vectorSearch: {
  index: "vector_index",
  path: "embedding",
  queryVector: queryEmbedding,
  numCandidates: 100,
  limit: 10,
  filter: { "metadata.source": "https://docs.mongodb.com" }
}
```

---

## Summary

- **Text:** `content`.
- **Metadata:** `metadata.title`, `metadata.tags`, `metadata.source`.
- **Embedding:** `embedding` (float[]), top-level, same length as index `numDimensions`.
- **Index:** one vector field `embedding` with `similarity: "cosine"`; add `filter` fields only if you use pre-filters in `$vectorSearch`.
