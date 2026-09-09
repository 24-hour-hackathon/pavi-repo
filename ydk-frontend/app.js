/* Frontend adapter: replace loadEvaluationResults() with a GET to your existing API when ready. */
const demoMetrics = {
  total_tested: 5, correct_answers: 4, retrieval_accuracy: 80.0, unsupported_detection: 100.0, citation_coverage: 100.0,
  details: [
    { Question:"What is the casual leave entitlement per year?", "Expected Source":"Leave_Policy.pdf", "Retrieved Source":"Leave_Policy.pdf", "Retrieval Check":"PASS", "Citation Check":"PASS", Status:"PASS" },
    { Question:"How many working hours are expected weekly?", "Expected Source":"Employee_Handbook.pdf", "Retrieved Source":"Employee_Handbook.pdf", "Retrieval Check":"PASS", "Citation Check":"PASS", Status:"PASS" },
    { Question:"What is the mandatory password renewal policy?", "Expected Source":"IT_Security.pdf", "Retrieved Source":"IT_Security.pdf", "Retrieval Check":"PASS", "Citation Check":"PASS", Status:"PASS" },
    { Question:"What is the annual salary of the CEO?", "Expected Source":"NOT AVAILABLE", "Retrieved Source":"None", "Retrieval Check":"PASS", "Citation Check":"PASS", Status:"PASS" },
    { Question:"What is the policy for expense reimbursement limits on dinners?", "Expected Source":"Expense_Policy.pdf", "Retrieved Source":"Unknown.pdf", "Retrieval Check":"FAIL", "Citation Check":"FAIL", Status:"FAIL" }
  ]
};

let metrics = demoMetrics;
const $ = (id) => document.getElementById(id);

function normalizeDetail(item) {
  const source = item["Retrieved Source"] ?? item.retrieved_source ?? item.retrieved_sources ?? "None";
  const status = item.Status ?? item.status ?? "FAIL";
  return {
    question: item.Question ?? item.question ?? "—",
    expected: item["Expected Source"] ?? item.expected_source ?? "—",
    actual: item["Actual Result"] ?? item.actual_result ?? source,
    source,
    grounded: item.Grounded ?? item.grounded ?? (source !== "None" && source !== ""),
    status: String(status).toUpperCase(),
    latency: item.Latency ?? item.latency ?? "—",
    category: item.Category ?? item.category ?? "Unclassified"
  };
}

function renderKpis() {
  $("totalTested").textContent = metrics.total_tested ?? "—";
  $("passed").textContent = metrics.correct_answers ?? "—";
  $("failed").textContent = metrics.total_tested != null && metrics.correct_answers != null ? metrics.total_tested - metrics.correct_answers : "—";
  $("grounding").textContent = metrics.retrieval_accuracy != null ? `${Number(metrics.retrieval_accuracy).toFixed(1)}%` : "—";
  $("unsupported").textContent = metrics.unsupported_detection != null ? `${Number(metrics.unsupported_detection).toFixed(1)}%` : "—";
  $("latency").textContent = metrics.average_latency_ms != null ? `${metrics.average_latency_ms} ms` : "—";
  $("scoreValue").textContent = metrics.retrieval_accuracy != null ? Number(metrics.retrieval_accuracy).toFixed(1) : "—";
  const score = Number(metrics.retrieval_accuracy ?? 0);
  $("scoreRing").style.background = `conic-gradient(var(--mint) 0 ${score}%, #254149 ${score}% 100%)`;
  $("retrievalProgressLabel").textContent = metrics.retrieval_accuracy != null ? `${Number(metrics.retrieval_accuracy).toFixed(1)}%` : "—";
  $("retrievalProgress").style.width = `${score}%`;
  const citation = Number(metrics.citation_coverage ?? 0);
  $("citationProgressLabel").textContent = metrics.citation_coverage != null ? `${citation.toFixed(1)}%` : "—";
  $("citationProgress").style.width = `${citation}%`;
  $("scoreStatus").textContent = score >= 90 ? "✅ Healthy" : "⚠ Needs review";
  $("scoreStatus").className = `status-pill ${score >= 90 ? "success" : "warning"}`;
}

function renderTable() {
  const category = $("categoryFilter").value;
  const status = $("statusFilter").value;
  const rows = (metrics.details ?? []).map(normalizeDetail).filter((item) => (category === "all" || item.category === category) && (status === "all" || item.status === status));
  $("resultsBody").innerHTML = rows.map((item) => `<tr><td>${escapeHtml(item.question)}</td><td>${escapeHtml(item.expected)}</td><td>${escapeHtml(item.actual)}</td><td><span class="${item.grounded ? "grounding-badge grounded" : "grounding-badge ungrounded"}">${item.grounded ? "✅ Grounded" : "⚠ Ungrounded"}</span></td><td><span class="status-badge ${item.status === "PASS" ? "pass" : "fail"}">${item.status === "PASS" ? "✅ Passed" : "❌ Failed"}</span></td><td>${escapeHtml(String(item.latency))}</td><td class="source-cell">${escapeHtml(item.source)}</td></tr>`).join("");
  $("emptyResults").classList.toggle("hidden", rows.length !== 0);
}

function escapeHtml(value) { return value.replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[char])); }
async function loadEvaluationResults() {
  /* The existing dashboard.py has no HTTP contract. Use demoMetrics until one exists. */
  return demoMetrics;
}
async function runEvaluation() {
  $("runStatus").textContent = "Running benchmark…";
  $("runButton").disabled = true;
  await new Promise((resolve) => setTimeout(resolve, 650));
  try { metrics = await loadEvaluationResults(); renderKpis(); renderTable(); $("lastRun").textContent = "Just now"; showToast("Evaluation results refreshed"); } finally { $("runButton").disabled = false; $("runStatus").textContent = "Latest results loaded"; }
}
function showToast(text) { const toast = $("toast"); toast.textContent = text; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 2200); }

$("runButton").addEventListener("click", runEvaluation);
$("refreshButton").addEventListener("click", () => { renderKpis(); renderTable(); showToast("Showing latest available results"); });
$("categoryFilter").addEventListener("change", renderTable);
$("statusFilter").addEventListener("change", renderTable);
renderKpis();
renderTable();
