# YDK Enterprise QA Assistant

Presentation-ready frontend for the Enterprise Document QA Assistant: Assistant chat, Knowledge Base administration, Evaluation, and links to the existing User/Admin login screens.

## Run locally

Serve this folder with any static server, then open `index.html`. The FastAPI address is configured exactly once in `api-config.js`:

```js
const API_BASE_URL = "http://127.0.0.1:8000";
```

Change that one constant when deploying. Login remains frontend-only until an authentication API is supplied; it does not claim to provide real authentication.

## Connected RAG APIs

| UI action | API | Request / response used |
| --- | --- | --- |
| Ask assistant | `POST /api/chat` | Sends `{ question }`; renders `answer`, `has_answer`, and every source's `document`, `page`, `section`, `chunk_id`, `supporting_text`. |
| List knowledge base | `GET /api/documents` | Accepts an array or a wrapper with `documents`, `items`, or `data`. |
| Upload and index | `POST /api/documents/upload` | Sends a multipart field named `file`. |
| Re-index | `POST /api/documents/{id}/reindex` | Uses `id` or `document_id` supplied by the document list. |
| Delete | `DELETE /api/documents/{id}` | Uses `id` or `document_id` supplied by the document list. |

For `has_answer: false`, the Assistant deliberately shows “Information not available in the approved knowledge base” and renders no citations.

## Backend mapping

| UI field | Expected backend/evaluation field |
| --- | --- |
| Total test cases | `metrics.total_tested` |
| Passed | `metrics.correct_answers` |
| Failed | `metrics.failed` when the future API provides it; otherwise `—` (the UI does not invent it) |
| RAG Grounding Score | `metrics.retrieval_accuracy` |
| Unsupported rejection | `metrics.unsupported_detection` |
| Average latency | `metrics.average_latency` or `metrics.avg_latency` (not currently produced; UI shows `—`) |
| Question | `details[].Question` |
| Expected behavior | `details[].Expected Source` and future `details[].expected_behavior` |
| Actual result | `details[].Actual Result` or `details[].Retrieved Source` |
| Grounded / Ungrounded | `details[].grounded` or existing `details[].Retrieval Check` |
| Pass / Fail | `details[].Status` |
| Latency | future `details[].Latency` or `details[].latency` |
| Source found | `details[].source_found` or existing `details[].Citation Check` |
| Test category | future `details[].Category`; UI displays `Unclassified` until supplied |

`api-config.js` deliberately sets `evaluationResultsUrl` and `evaluationRunUrl` to `null` until YDK exposes real endpoints. The modular adapter in `api-client.js` therefore displays “Evaluation backend not connected” rather than demo metrics. Set those endpoint paths when the evaluator is exposed; no RAG or evaluator code needs to be rewritten by this frontend.
