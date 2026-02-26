# MongoDB Atlas App Services — Document Ingestion & Semantic Search

This folder contains **Atlas App Services** (Realm) functions and config for:

- **Document ingestion** — POST `/ingest` (embeddings via OpenAI, store in MongoDB)
- **Semantic search** — GET/POST `/search` (vector search using `$vectorSearch`)
- **Authentication** — API Key and/or Email/Password
- **Role-based access** — `admin`, `ingest`, `search`/`user` via custom user data

**Note:** Atlas App Services has been announced end-of-life; these assets are provided for existing deployments or evaluation. For new projects, consider the Node/Express API in this repo or Atlas Data API.

---

## 1. Create an App and link Atlas

1. In **MongoDB Atlas** → your project → **App Services** → **Create a New App** (or use an existing app).
2. Link your **Atlas cluster** as a data source named **`mongodb-atlas`** (default).
3. Ensure the cluster has a **Vector Search index** on your documents collection (see repo `docs/atlas-vector-index.json`). Index name: `vector_index` (or set env value `VECTOR_INDEX_NAME`).

---

## 2. Authentication

1. In the app → **Authentication** → **Providers**.
2. Enable **API Key** (for server/frontend server-side calls) and/or **Email/Password** (for user logins).
3. **Custom User Data** (for roles):
   - Turn on **Custom User Data**.
   - Set **MongoDB Service** to `mongodb-atlas`, **Database** to the same DB you use for documents (e.g. `semantic_search`), **Collection** to e.g. `users_metadata`, **User ID Field** to `user_id`.
4. In that `users_metadata` collection, add one document per user:
   - `user_id`: string equal to the App Services **User ID** (from Authentication → Users → copy ID).
   - `role`: one of `"admin"` | `"ingest"` | `"search"` | `"user"`.

**Roles:**

| Role     | Ingest (POST /ingest) | Search (GET/POST /search) |
|----------|------------------------|----------------------------|
| `admin`  | Yes                    | Yes                        |
| `ingest` | Yes                    | No                         |
| `search` | No                     | Yes                        |
| `user`   | No                     | Yes                        |

---

## 3. Values and secrets

1. **Values** (or **Secrets**): create a **Secret** (or Value) named **`OPENAI_API_KEY`** with your OpenAI API key.
2. Optional **Environment Values** (per environment):
   - `DB_NAME` — database name (default: `semantic_search`)
   - `COLLECTION_NAME` — collection name (default: `documents`)
   - `VECTOR_INDEX_NAME` — Atlas Vector Search index name (default: `vector_index`)

---

## 4. Deploy the functions

1. In the app → **Functions**.
2. Create two functions and paste the code from this repo:
   - **`ingest`** — copy from `functions/ingest.js`.
   - **`search`** — copy from `functions/search.js`.
3. In **HTTPS Endpoints**:
   - Add endpoint **Route** `/ingest`, **Method** `POST`, **Function** `ingest`, **Respond with Result** off. Enable **Request Authentication** (Application) and **Fetch Custom User Data**.
   - Add endpoint **Route** `/search`, **Method** `GET`, **Function** `search` (same auth/custom data).
   - Add endpoint **Route** `/search`, **Method** `POST`, **Function** `search` (same auth/custom data).
4. **Deploy** the app.

---

## 5. Call the API from the frontend

**Base URL (global):** `https://data.mongodb-api.com/app/<YOUR_APP_ID>/endpoint`

**Authentication:** Use one of:

- **API Key (server only):** header `apiKey: <API_KEY>`.
- **Bearer token:** after logging in with Email/Password or API Key, use `Authorization: Bearer <ACCESS_TOKEN>`.

**Ingest (requires role `admin` or `ingest`):**

```bash
curl -X POST "https://data.mongodb-api.com/app/<APP_ID>/endpoint/ingest" \
  -H "Content-Type: application/json" \
  -H "apiKey: <YOUR_API_KEY>" \
  -d '{"documents":[{"content":"Your text here","metadata":{"title":"Doc 1","tags":["a","b"],"source":"https://example.com"}}]}'
```

**Search (requires role `admin`, `ingest`, `search`, or `user`):**

```bash
# GET
curl "https://data.mongodb-api.com/app/<APP_ID>/endpoint/search?q=your+query&limit=5" \
  -H "apiKey: <YOUR_API_KEY>"

# POST
curl -X POST "https://data.mongodb-api.com/app/<APP_ID>/endpoint/search" \
  -H "Content-Type: application/json" \
  -H "apiKey: <YOUR_API_KEY>" \
  -d '{"query":"your query","limit":5}'
```

**From a browser (user auth):** Log in with Email/Password (or API Key if not user-facing), get an access token, then call the endpoints with `Authorization: Bearer <token>`. Do not embed API keys in client-side code.

**Using the React frontend:** Set the API base URL to your App Services endpoint base (e.g. `https://data.mongodb-api.com/app/<APP_ID>/endpoint`) and send the user’s access token (or a server API key from your backend) in the `Authorization: Bearer <token>` or `apiKey` header. Implement login (Email/Password or API Key) and store the token; use it for `/ingest` and `/search` requests.

---

## 6. Secure API access summary

- **Authentication:** Every request must authenticate (API Key or Bearer token). Unauthenticated requests get `401`.
- **Role-based access:** Functions read `context.user.custom_data.role` (from your custom user data collection). Wrong role returns `403`.
- **Secrets:** Store `OPENAI_API_KEY` in App Services Secrets/Values so it never appears in client code.
- **HTTPS only:** All endpoint traffic is over HTTPS.

---

## File layout

```
atlas_app_services/
  README.md                 This file
  config/
    https_endpoints.json    Endpoint routes/methods (reference)
    auth.json               Auth + custom user data (reference)
    roles_example.json      Role examples for users_metadata
  functions/
    ingest.js               POST /ingest handler (embed + store)
    search.js               GET/POST /search handler (vector search)
    lib/
      auth.js               Role helpers (reference; logic inlined in ingest/search)
      openai.js             OpenAI helpers (reference; logic inlined in ingest/search)
```

Use `functions/ingest.js` and `functions/search.js` in the App Services UI; the `lib/` and `config/` files are for reference or CLI import.
