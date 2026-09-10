/* Change this one value when the FastAPI service is deployed elsewhere. */
const API_BASE_URL = "http://127.0.0.1:8000";
const API_ENDPOINTS = {
  chat: "/api/chat",
  documents: "/api/documents",
  uploadDocument: "/api/documents/upload",
  reindexDocument: (id) => `/api/documents/${encodeURIComponent(id)}/reindex`,
  deleteDocument: (id) => `/api/documents/${encodeURIComponent(id)}`,
  // Connected to live backend evaluation API exposing real YDK results
  evaluationResultsUrl: "/api/evaluation/results",
  evaluationRunUrl: "/api/evaluation/run"
};
