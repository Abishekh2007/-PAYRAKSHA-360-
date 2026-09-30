# HTTP API

All three apps (ports 7480, 7481, 7482) expose the same API. In dev, the API runs on `http://127.0.0.1:8000` and the Vite servers proxy `/api` to it. Every JSON response includes `"simulation": true`. Interactive docs are served by FastAPI at `/docs`.

> No endpoint moves money, contacts a bank, or sends anything to a real person.

## Risk analysis (`backend/app/main.py`)

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/health` | — | `{status: "ok", engine, ml, simulation}` |
| POST | `/api/analyze` | `AnalyzeInput` (see [RISK_ENGINE.md](RISK_ENGINE.md#1-input)) | `RiskReport` with an extra `ml` field (`MlInsight` or `null`) |
| POST | `/api/analyze/url` | `{url}` | URL analysis |
| POST | `/api/qr/parse` | `{text}` | Parsed QR fields and flags |
| GET | `/api/scenarios` | — | Demo scenarios from `shared/scenarios.json` |

Errors: `422` for invalid JSON, an empty input, or fields over their length limits.

```bash
curl -s localhost:7480/api/analyze -H "content-type: application/json" \
  -d '{"qrText":"PAYRAKSHA://demo-payment\nrecipient=unknown-electricity@demo\namount=1999\nmerchant=Electricity Board Demo\nsource=WhatsApp Demo\nurgency=true\nrecipientVerified=false","behaviour":{"onCall":true}}'
# → "score": 75, "level": "HIGH_CAUTION", plus contributions, dna, attackChain, explanation …
```

## Phone ↔ console link (`backend/app/link.py`)

An in-memory store shared by all apps in the process: at most 50 events, never persisted.

| Method | Path | Body / query | Returns | Errors |
|---|---|---|---|---|
| POST | `/api/link/scan` | `{device (1–40 chars), source, input, replaces?}` | `{event, report, ml}` | 422 invalid input; 404 unknown `replaces` |
| POST | `/api/link/decision` | `{id, decision}` with decision one of `pending`, `cancelled`, `verify`, `trusted`, `paid_demo` | `{event}` | 404 / 422 |
| GET | `/api/link/events?after=<seq>` | — | `{events, latestSeq, devices, target}`, oldest first | — |
| POST | `/api/link/heartbeat` | `{device}` | `{ok, target}` | — |
| POST | `/api/link/target` | `{qrText (≤ 4096), label? (≤ 80)}` | `{target}` (the QR the console is presenting) | 422 |
| GET | `/api/link/info` | — | `{consoleUrl, payUrl, phoneUrl, lan}` | — |
| POST | `/api/link/reset` | — | `{ok}` | — |

`source` is one of `camera`, `gallery`, `console-target`, `sample`, `manual`. A device counts as online if it was seen in the last 10 seconds.

## Bank / vendor audit (`backend/app/bank/router.py`)

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/bank/vendors` | — | Demo merchants, each with location, KYC state, metrics and latest audit |
| GET | `/api/bank/vendors/{vid}` | — | One merchant with recent payments and its merchant QR payload |
| POST | `/api/bank/audit` | `{vendorId, amount?, device?}` | Starts an audit and returns its id; the audit runs in a background thread |
| GET | `/api/bank/audits` | — | Recent audits |
| GET | `/api/bank/audits/{rid}` | — | Audit result: score, verdict, red flags with evidence, model and raw output |
| GET | `/api/bank/audits/{rid}/live` | — | Live reasoning stream for the auditor UI |
| GET / POST | `/api/bank/settings` | `{model?, …}` | Auditor settings |
| GET | `/api/bank/db` | — | Which database is active (Postgres or SQLite) and its row counts |

Verdict labels: `LIKELY_SAFE` → "Low risk", `CAUTION`, `SUSPICIOUS` → "Suspicious", `HIGH_RISK` → "Multiple warning signals detected".

The auditor calls `OMNIROUTE_BASE_URL` with the `OMNIROUTE_API_KEY` key and the `PAYRAKSHA_AUDIT_MODEL` model. If that call fails, times out (`PAYRAKSHA_AUDIT_TIMEOUT`) or `PAYRAKSHA_AUDIT_AI=0`, a deterministic simulated auditor produces the report.
