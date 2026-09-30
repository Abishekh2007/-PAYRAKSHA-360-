# Feasibility, scalability and limitations

## Practicality and cost

| Aspect | Why it is practical |
|---|---|
| Compute | The risk engine is a deterministic weighted model: microseconds of CPU per check, no GPU, and no per-check AI fee. |
| Runs on the device | The same engine runs in the browser/app offline, so a check works without network access and payment data need not leave the phone. |
| AI only where it pays off | The LLM is used for bank-side merchant audits, where a slower, deeper review is worth it, not in the customer's payment path. |
| Tunable without redeploying code | Weights, lexicons, patterns and URL rules are JSON config (`shared/*.json`). |
| Cheap to run the demo | One exe, one process, SQLite fallback; no cloud account needed. |

## Deployment path

1. **Check-before-pay SDK** inside existing UPI/banking apps: call the engine after a QR is scanned and before the confirm screen. RakshaPay shows the intended UX.
2. **Bank risk API**: `/api/analyze` and `/api/link/*` as a service. Anonymised check events feed the fraud-operations console.
3. **Merchant audit service**: `/api/bank/*` connected to the bank's merchant KYC and dispute data instead of the demo DB.
4. **Intelligence loop**: confirmed scam reports update lexicons, patterns and payee reputation, re-validated by the golden tests before release.

## Scaling

| Component | Demo | Production path |
|---|---|---|
| Analysis API | Single uvicorn process | Stateless: horizontal replicas behind a load balancer |
| Engine | JS in the browser + Python on the server | Same; could also be compiled to WASM/Kotlin/Swift for native apps, and the golden set keeps every port identical |
| Live link | In-memory deque of 50 events, polling | Redis Streams / Kafka with WebSocket push, partitioned by bank branch or region |
| Database | Postgres, or SQLite fallback | Managed Postgres with read replicas |
| AI audits | One background thread per audit | A job queue (e.g. Celery/RQ) with rate limits and caching per merchant |
| Payee reputation | Static demo directory | A shared reputation service (verified merchants, reported VPAs) |

## Maintainability

* **One source of truth**: all tunables in `shared/`; one reference engine; a Python port proven identical by 103 golden cases.
* Strict TypeScript, **305 frontend + 140 backend tests**, and acceptance tests that define the contracts.
* Clear module boundaries: console, phone app, auditor, backend and shared config ([ARCHITECTURE.md](../ARCHITECTURE.md)).

## Limitations

We state these openly:

* **Demo data only.** Weights and examples were chosen by the team for the demo, not learned or validated on real fraud data. A real deployment needs calibration on labelled bank data and measured false-positive rates.
* **No real payment integration**, deliberately. Integrating with NPCI/UPI or a bank's payment flow is outside the scope of a hackathon and would need regulatory approval.
* **Context depends on the user.** "On a call" and "screen share" are supplied by the user in one tap. A native app could detect some of these signals itself, with permission.
* **Payee history is simulated.** Real novelty and reputation signals need the bank's transaction history and a shared reputation service.
* **Language coverage.** The lexicons cover English and common Indian scam phrasing; regional languages would need more lexicons.
* **The phone camera needs HTTPS.** On a phone this means running it through Tailscale (or any HTTPS host). Gallery upload and samples work without it.
* **The live link is in memory**, so it is lost on restart. That is intended for a demo, not for production.
* **The ML model is a toy** trained on synthetic text. It is shown only as a second opinion and never affects the score.
