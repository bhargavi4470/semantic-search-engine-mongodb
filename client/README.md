# Semantic Search — React + Tailwind

Modern React frontend for the semantic search API.

## Setup

```bash
npm install
```

## Run (development)

Start the **API** first (from repo root):

```bash
npm start
```

Then start the **client** (from `client/`):

```bash
npm run dev
```

Open **http://localhost:5173**. The Vite dev server proxies `/search` and `/ingest` to `http://localhost:3000`.

## Build

```bash
npm run build
```

Output is in `dist/`. Serve it with any static host or from the Express app; ensure the API is reachable (same origin or CORS/proxy).

## Features

- **Search** – Input, Search button, loading spinner, result cards (title, snippet, similarity score, optional AI explanation).
- **Upload** – Form to add documents (content, title, tags, source).
- Responsive layout; Tailwind CSS.
