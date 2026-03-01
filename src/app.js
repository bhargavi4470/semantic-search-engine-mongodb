import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleIngest } from './routes/ingest.js';
import { handleSearch } from './routes/search.js';
import { handleStats } from './routes/stats.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { asyncHandler } from './middleware/asyncHandler.js';

import authRoutes from './routes/auth.js';
import { authMiddleware } from './middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json({ limit: '50mb' }));

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'semantic-search' });
});

app.use('/api/auth', authRoutes);

// Protected routes
app.get('/stats', authMiddleware, asyncHandler(handleStats));
app.post('/ingest', authMiddleware, asyncHandler(handleIngest));
app.post('/search', authMiddleware, asyncHandler(handleSearch));
app.get('/search', authMiddleware, asyncHandler(handleSearch));

app.use(notFound);
app.use(errorHandler);

export default app;
