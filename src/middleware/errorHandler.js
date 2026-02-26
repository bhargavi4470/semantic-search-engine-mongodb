/**
 * Global error handler: log and return JSON error response.
 * Uses err.statusCode or err.status for HTTP status when present.
 */
export function errorHandler(err, _req, res, _next) {
  let status = err.statusCode ?? err.status ?? 500;
  const message = err.message ?? 'Internal server error';

  if ((err.name === 'EmbeddingError' || err.code === 'EMBEDDING_ERROR') && typeof err.status === 'number') {
    status = err.status;
  }
  if (err.name === 'MongoServerError') {
    if (err.code === 11000) status = 409;
    else if (err.code === 121) status = 400;
  }
  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    status = 503;
  }

  if (status >= 500) {
    console.error('[Error]', err);
  } else {
    console.warn('[Client Error]', status, message);
  }

  res.status(status).json({
    error: err.name || 'Error',
    message,
    ...(err.code && { code: err.code }),
    ...(process.env.NODE_ENV === 'development' && err.stack && { stack: err.stack }),
  });
}
