/**
 * Role-based access helpers for Atlas App Services.
 * Expects context.user.custom_data.role: "admin" | "ingest" | "search" | "user"
 * - admin: full access (ingest + search)
 * - ingest: can call ingest only
 * - search / user: can call search only
 */

const ROLES = {
  ADMIN: "admin",
  INGEST: "ingest",
  SEARCH: "search",
  USER: "user",
};

function getRole(context) {
  if (!context.user || !context.user.custom_data) return null;
  return context.user.custom_data.role || null;
}

function hasIngestAccess(context) {
  const role = getRole(context);
  return role === ROLES.ADMIN || role === ROLES.INGEST;
}

function hasSearchAccess(context) {
  const role = getRole(context);
  return role === ROLES.ADMIN || role === ROLES.INGEST || role === ROLES.SEARCH || role === ROLES.USER;
}

exports.getRole = getRole;
exports.hasIngestAccess = hasIngestAccess;
exports.hasSearchAccess = hasSearchAccess;
exports.ROLES = ROLES;
