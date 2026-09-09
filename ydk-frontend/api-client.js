function apiUrl(path) { return `${API_BASE_URL}${path}`; }
async function request(path, options = {}) {
  let response;
  try { response = await fetch(apiUrl(path), { credentials: "include", ...options }); }
  catch (_) { throw new Error("Backend unavailable. Start the FastAPI server and try again."); }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || body.message || `Request failed (${response.status}).`);
  return body;
}
const BackendApi = {
  async checkConnection() { try { const response = await fetch(apiUrl("/docs")); return response.ok; } catch (_) { return false; } },
  ask: (question) => request(API_ENDPOINTS.chat, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question }) }),
  listDocuments: () => request(API_ENDPOINTS.documents),
  uploadDocument: (file) => { const data = new FormData(); data.append("file", file); return request(API_ENDPOINTS.uploadDocument, { method: "POST", body: data }); },
  reindexDocument: (id) => request(API_ENDPOINTS.reindexDocument(id), { method: "POST" }),
  deleteDocument: (id) => request(API_ENDPOINTS.deleteDocument(id), { method: "DELETE" }),
  getEvaluation: () => API_ENDPOINTS.evaluationResultsUrl ? request(API_ENDPOINTS.evaluationResultsUrl) : Promise.reject(new Error("Evaluation backend not connected")),
  runEvaluation: () => API_ENDPOINTS.evaluationRunUrl ? request(API_ENDPOINTS.evaluationRunUrl, { method: "POST" }) : Promise.reject(new Error("Evaluation backend not connected"))
};
