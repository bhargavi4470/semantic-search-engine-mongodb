/**
 * 404 handler for unknown routes.
 */
export function notFound(_req, res) {
  res.status(404).json({
    error: 'Not Found',
    message: 'Route not found. Use POST /ingest or POST|GET /search.',
  });
}
