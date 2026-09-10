const state = { documents: [] };
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));

function setStatus(selector, message, kind = "") {
  const element = $(selector);
  if (!element) return;
  element.textContent = message;
  element.className = `form-hint ${kind}`;
}

function toast(message, kind = "") {
  const element = $("#toast");
  if (!element) return;
  element.textContent = message;
  element.className = `toast show ${kind}`;
  window.setTimeout(() => { element.className = "toast"; }, 3500);
}

function setBusy(button, busy, busyText) {
  if (!button) return;
  button.disabled = busy;
  button.dataset.label ||= button.textContent;
  button.textContent = busy ? busyText : button.dataset.label;
}

async function checkConnection() {
  const online = await BackendApi.checkConnection();
  const element = $("#connection-state");
  if (!element) return;
  element.classList.toggle("offline", !online);
  element.querySelector("span").textContent = online ? "Backend connected" : "Backend unavailable";
}

function selectView(view) {
  document.querySelectorAll(".view").forEach((item) => item.classList.toggle("active", item.id === `${view}-view`));
  document.querySelectorAll("[data-view]").forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  const titles = {
    assistant: ["KNOWLEDGE WORKSPACE", "Assistant"],
    knowledge: ["APPROVED DOCUMENTS", "Knowledge Base"],
    evaluation: ["QUALITY ASSURANCE", "Evaluation & Testing"]
  };
  if (titles[view]) {
    $("#view-kicker").textContent = titles[view][0];
    $("#view-title").textContent = titles[view][1];
  }
  if (view === "knowledge") loadDocuments();
  if (view === "evaluation") loadEvaluation(false);
}

function renderQuestion(question) {
  return `<article class="message user-message"><p class="message-label">YOU</p><p>${escapeHtml(question)}</p></article>`;
}

function renderSources(sources) {
  if (!Array.isArray(sources) || !sources.length) return "";
  return `<div class="sources"><p class="message-label">SUPPORTING SOURCES</p>${sources.map((source) => `<article class="source-card"><div class="source-head"><strong>${escapeHtml(source.document || "Approved document")}</strong><span>${source.page ? `Page ${escapeHtml(source.page)}` : "Source"}</span></div>${source.section ? `<p class="source-section">${escapeHtml(source.section)}</p>` : ""}${source.chunk_id ? `<p class="supporting-text">Chunk: ${escapeHtml(source.chunk_id)}</p>` : ""}${source.supporting_text ? `<p class="supporting-text">${escapeHtml(source.supporting_text)}</p>` : ""}</article>`).join("")}</div>`;
}

function renderAnswer(result) {
  if (!result.has_answer) {
    return `<article class="message unsupported-message"><p class="message-label">KNOWLEDGE BASE</p><h3>Information not available in the approved knowledge base.</h3><p>This question could not be supported by indexed documents, so no answer or citations were generated.</p></article>`;
  }
  return `<article class="message assistant-message"><p class="message-label">YDK ASSISTANT <span class="grounded">✓ Grounded</span></p><p>${escapeHtml(result.answer || "No answer was returned.")}</p>${renderSources(result.sources)}</article>`;
}

async function askQuestion(question) {
  const trimmed = question.strip ? question.strip() : question.trim();
  if (!trimmed) return;
  const history = $("#chat-history");
  if (history.querySelector(".empty-chat")) history.innerHTML = "";
  history.insertAdjacentHTML("beforeend", renderQuestion(trimmed));
  const pending = document.createElement("article");
  pending.className = "message thinking";
  pending.textContent = "Thinking… Searching approved documents.";
  history.append(pending);
  history.scrollTop = history.scrollHeight;

  const button = $("#ask-button");
  setBusy(button, true, "Searching…");
  setStatus("#chat-status", "Retrieving context and verifying grounding…");

  try {
    const result = await BackendApi.ask(trimmed);
    pending.remove();
    history.insertAdjacentHTML("beforeend", renderAnswer(result));
    setStatus("#chat-status", "Answer generated and verified from approved knowledge base.", "success");
  } catch (error) {
    pending.remove();
    history.insertAdjacentHTML("beforeend", `<article class="message error-message"><p class="message-label">CONNECTION ERROR</p><p>${escapeHtml(error.message)}</p></article>`);
    setStatus("#chat-status", error.message, "error");
  } finally {
    setBusy(button, false);
    history.scrollTop = history.scrollHeight;
    checkConnection();
  }
}

function documentItems(payload) {
  if (Array.isArray(payload)) return payload;
  return payload.documents || payload.items || payload.data || [];
}

function documentId(doc) {
  return doc.id ?? doc.document_id ?? doc.filename ?? doc.name;
}

function renderDocuments() {
  const list = $("#document-list");
  $("#document-count").textContent = `${state.documents.length} document${state.documents.length === 1 ? "" : "s"}`;
  if (!state.documents.length) {
    list.innerHTML = `<div class="empty-list">No indexed documents yet. Upload an approved PDF, DOCX, or TXT file.</div>`;
    return;
  }
  list.innerHTML = state.documents.map((doc) => {
    const id = documentId(doc);
    const filename = doc.filename || doc.name || "Untitled document";
    const type = doc.file_type || doc.type || filename.split(".").pop()?.toUpperCase() || "FILE";
    const chunks = doc.chunk_count ?? doc.chunks ?? "—";
    const version = doc.version ?? "—";
    const status = doc.status || "Indexed";
    const updated = doc.updated_at || doc.created_at || "";
    return `<article class="document-row"><div class="file-icon">${escapeHtml(type).slice(0, 4)}</div><div class="document-meta"><strong>${escapeHtml(filename)}</strong><span>${escapeHtml(type)} • ${escapeHtml(status)} • v${escapeHtml(version)} • ${escapeHtml(chunks)} chunks${updated ? ` • ${escapeHtml(updated)}` : ""}</span></div><div class="document-actions"><button class="text-btn reindex-button" data-id="${escapeHtml(id)}">Re-index</button><button class="text-btn danger delete-button" data-id="${escapeHtml(id)}">Delete</button></div></article>`;
  }).join("");
}

async function loadDocuments() {
  const list = $("#document-list");
  list.innerHTML = `<div class="loading-row">Loading documents…</div>`;
  try {
    state.documents = documentItems(await BackendApi.listDocuments());
    renderDocuments();
  } catch (error) {
    list.innerHTML = `<div class="error-row">${escapeHtml(error.message)}</div>`;
  } finally {
    checkConnection();
  }
}

async function uploadDocument(file) {
  const button = $("#upload-button");
  setBusy(button, true, "Uploading…");
  setStatus("#upload-status", "Uploading document…");
  try {
    await BackendApi.uploadDocument(file);
    setStatus("#upload-status", "Indexing document…");
    await loadDocuments();
    setStatus("#upload-status", "Document uploaded and indexed.", "success");
    $("#upload-form").reset();
    $("#file-name").textContent = "No file selected";
    toast("Document uploaded and indexed.", "success");
  } catch (error) {
    setStatus("#upload-status", `Upload failed: ${error.message}`, "error");
    toast("Upload failed: " + error.message, "error");
  } finally {
    setBusy(button, false);
    checkConnection();
  }
}

async function reindexDocument(id, button) {
  setBusy(button, true, "Indexing…");
  try {
    toast("Re-indexing document…");
    await BackendApi.reindexDocument(id);
    await loadDocuments();
    toast("Document re-indexed.", "success");
  } catch (error) {
    toast(error.message, "error");
  } finally {
    setBusy(button, false);
    checkConnection();
  }
}

async function deleteDocument(id, button) {
  if (!window.confirm("Delete this document from the knowledge base?")) return;
  setBusy(button, true, "Deleting…");
  try {
    await BackendApi.deleteDocument(id);
    await loadDocuments();
    toast("Document deleted.", "success");
  } catch (error) {
    toast(error.message, "error");
  } finally {
    setBusy(button, false);
    checkConnection();
  }
}

function evaluationUnavailable() {
  $("#evaluation-message").hidden = false;
  $("#evaluation-placeholder").hidden = false;
  $("#evaluation-results").hidden = true;
}

async function loadEvaluation(run = false) {
  const button = $(run ? "#run-evaluation" : "#refresh-evaluation");
  setBusy(button, true, run ? "Running…" : "Refreshing…");
  try {
    const result = await (run ? BackendApi.runEvaluation() : BackendApi.getEvaluation());
    renderEvaluation(result);
    toast(run ? "Live evaluation benchmark completed." : "Evaluation results loaded.", "success");
  } catch (error) {
    evaluationUnavailable();
    toast(error.message, "warning");
  } finally {
    setBusy(button, false);
  }
}

function evaluationValue(metrics, ...keys) {
  return keys.map((key) => metrics[key]).find((value) => value !== undefined && value !== null) ?? "—";
}

function renderEvaluation(result) {
  const metrics = result.metrics || result;
  const cases = result.test_cases || result.details || [];
  const groundingScore = evaluationValue(metrics, "grounding_accuracy", "retrieval_accuracy");
  const unsupportedRate = evaluationValue(metrics, "unsupported_query_rejection_rate", "unsupported_detection");
  const avgLatency = evaluationValue(metrics, "average_latency", "avg_latency");

  const cards = [
    ["Total test cases", evaluationValue(metrics, "total_tested", "total_test_cases")],
    ["Passed", evaluationValue(metrics, "correct_answers", "passed")],
    ["Failed", evaluationValue(metrics, "failed")],
    ["RAG Grounding Score", typeof groundingScore === "number" ? `${groundingScore}%` : groundingScore],
    ["Unsupported rejection", typeof unsupportedRate === "number" ? `${unsupportedRate}%` : unsupportedRate],
    ["Average latency", typeof avgLatency === "number" ? `${avgLatency}s` : avgLatency]
  ];

  $("#evaluation-message").hidden = true;
  $("#evaluation-placeholder").hidden = true;
  const root = $("#evaluation-results");
  root.hidden = false;

  root.innerHTML = `<div class="metrics-grid">${cards.map(([label, value]) => `<article class="metric-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`).join("")}</div><div class="evaluation-table-card"><h3>Recent evaluation history (Live RAG Backend)</h3>${cases.length ? `<div class="table-wrap"><table><thead><tr><th>Question</th><th>Expected behavior</th><th>Actual result</th><th>Grounded</th><th>Pass / Fail</th><th>Latency</th><th>Source found</th></tr></thead><tbody>${cases.map((item) => `<tr><td>${escapeHtml(item.question || item.Question || "—")}</td><td>${escapeHtml(item.expected_behavior || item["Expected Behavior"] || item.expected || item["Expected Source"] || "—")}</td><td>${escapeHtml(item.actual_result || item["Actual Answer"] || item.result || item["Retrieved Source"] || "—")}</td><td>${escapeHtml(item.grounded ?? item["Retrieval Check"] ?? "—")}</td><td><span class="badge badge-${(item.status || item.Status || "").toLowerCase()}">${escapeHtml(item.status || item.Status || "—")}</span></td><td>${escapeHtml(item.latency ?? item.Latency ?? "—")}</td><td>${escapeHtml(item.source_found ?? item["Citation Check"] ?? "—")}</td></tr>`).join("")}</tbody></table></div>` : `<p class="empty-list">The connected evaluation service did not return test-case history.</p>`}</div>`;
}

document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => selectView(button.dataset.view)));
$("#question-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = $("#question-input");
  askQuestion(input.value);
  input.value = "";
});
document.querySelectorAll(".suggestion").forEach((button) => button.addEventListener("click", () => {
  $("#question-input").value = button.textContent;
  $("#question-input").focus();
}));
$("#refresh-documents").addEventListener("click", loadDocuments);
$("#document-file").addEventListener("change", (event) => {
  $("#file-name").textContent = event.target.files[0]?.name || "No file selected";
});
$("#upload-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const file = $("#document-file").files[0];
  if (file) uploadDocument(file);
});
$("#document-list").addEventListener("click", (event) => {
  const id = event.target.dataset.id;
  if (!id) return;
  if (event.target.classList.contains("reindex-button")) reindexDocument(id, event.target);
  if (event.target.classList.contains("delete-button")) deleteDocument(id, event.target);
});
$("#refresh-evaluation").addEventListener("click", () => loadEvaluation(false));
$("#run-evaluation").addEventListener("click", () => loadEvaluation(true));

checkConnection();
loadDocuments();
