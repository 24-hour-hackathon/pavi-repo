# YDK Evaluation Dashboard

Frontend-only Evaluation & Testing dashboard for the Enterprise Document QA Assistant.

## Run locally

Open `index.html` with a static server. The interface currently uses a demo adapter in `app.js` because the existing `dashboard.py` is a Streamlit app and does not expose an HTTP API.

## Backend mapping

| UI field | Expected backend/evaluation field |
| --- | --- |
| Total test cases | `metrics.total_tested` |
| Passed | `metrics.correct_answers` |
| Failed | `total_tested - correct_answers` |
| RAG Grounding Score | `metrics.retrieval_accuracy` |
| Unsupported rejection | `metrics.unsupported_detection` |
| Citation coverage | `metrics.citation_coverage` |
| Average latency | `metrics.average_latency_ms` (not currently produced; UI shows `—`) |
| Question | `details[].Question` |
| Expected behavior | `details[].Expected Source` and future `details[].expected_behavior` |
| Actual result | `details[].Actual Result` or `details[].Retrieved Source` |
| Grounded / Ungrounded | future `details[].Grounded`; fallback derives from retrieved source presence |
| Pass / Fail | `details[].Status` |
| Latency | future `details[].Latency` or `details[].latency` |
| Source found | `details[].Retrieved Source` |
| Test category | future `details[].Category`; UI displays `Unclassified` until supplied |

The `Run Evaluation` button is deliberately isolated in `loadEvaluationResults()`. Replace that adapter with an existing evaluation endpoint when the backend exposes one; no RAG or evaluator code needs to be rewritten by this frontend.
