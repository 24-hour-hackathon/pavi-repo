/* Change this one value when the FastAPI service is deployed elsewhere. */
const API_BASE_URL = "http://127.0.0.1:8000";
const API_ENDPOINTS = {
  chat: "/api/chat", documents: "/api/documents", uploadDocument: "/api/documents/upload",
  reindexDocument: (id) => `/api/documents/${encodeURIComponent(id)}/reindex`,
  deleteDocument: (id) => `/api/documents/${encodeURIComponent(id)}`,
  // Populate only when YDK exposes its real evaluation API.
  evaluationResultsUrl: null, evaluationRunUrl: null
};
