# Things to do next — Vendor QR payments + AI Bank Auditor (DEMO / SIMULATION)

Written 2026-09-30 11:12 IST · deadline ≈ 12:52 IST · budget: ~70 % of remaining head usage → build the main path well, skip polish elsewhere.

## Goal (from the user)
1. **Banking app (main portal)** gets a **Vendor Payments** area: a **geographic India map** with vendor pins —
   big marketplaces (Amazon, Flipkart, Myntra, Swiggy, Zomato, BigBasket, Reliance Digital) and small local vendors —
   each vendor has a **payment QR** (demo payload) the phone can scan.
2. **Large payment** scanned on the phone (RakshaPay) → an **AI auditor** (OmniRoute `bedrock/zai.glm-5`) audits it
   *like a bank auditor* using the bank's **relational database** → a report with **score, verdict (scam-risk or not),
   vendor issues, security issues, reasoning, and the exact data it used**.
3. **Small payment** → reuse the **previous report**: show only **score + key points**; vendor privacy preserved
   (no full report, masked identifiers).
4. **AI audit fee:** the bank charges a **fixed** per-audit fee, set from the user's **transaction history with that
   vendor** (first-time / occasional / frequent). Clearly **SIMULATED — never charged**.
5. **Opt-out:** turning the service off shows a **bank warning**: the bank will not take accountability or the risk;
   the user is responsible. The user must acknowledge it, and the acknowledgement is stored.
6. **Three separate ports:**
   - **①** Banking app (console + vendors + map), port 9180;
   - **②** RakshaPay (GPay-style phone app), port 9181;
   - **③** **AI Auditor portal** (server-side reasoning console), port 9182.

## Who does what
| Who | Does |
|---|---|
| **Claude (head, writing code directly — the user said Orchestra can't do this part)** | Everything below: schema, seed, audit service, AI client, API, the three UIs, launcher and ports, tests of the core path |
| **The user** | Start **Docker Desktop** before the demo (`docker compose up -d db`). Keep OmniRoute reachable at `http://192.168.0.146:20128/v1`. Optionally drop official logo files into `public/vendors/<id>.svg` (brand artwork is trademarked; by default Claude draws brand-coloured monogram badges, not copied logos) |
| **Orchestra workers** | Nothing new. Only the already-running QA findings (qa-pay / qa-link) get handled |

## Decisions (made; the reasoning is kept short)
- **Real brand names** (user choice), with **monogram badges**, not logo artwork, and a footer "Brand names used for a
  hackathon demo; not affiliated; all transactions simulated".
  - The big brands are seeded as **verified merchants** with clean histories.
  - The scam cases are **impostor look-alikes** (`amaz0n-mega-sale@demo`, `flipkart-refund-desk@demo`) and risky small
    vendors. So the AI never labels a real company's own payments as a scam; it flags impersonation, which is the
    realistic threat.
- **DB:** SQLAlchemy Core, one schema.
  - `DATABASE_URL` points at Postgres in Docker (`docker-compose.yml`, `postgres:16-alpine`, host port 5433).
  - When it is unset or unreachable: **SQLite** at `backend/data/bank.db`, created and seeded on startup, so the demo and
    the exe always work.
- **AI:** OpenAI-compatible `POST {OMNIROUTE_BASE_URL}/chat/completions`, model `bedrock/zai.glm-5`, any key.
  - It asks for strict JSON; the timeout is 45 s.
  - On an error or bad JSON it falls back to a **deterministic simulated auditor**, labelled "SIMULATED AUDITOR (AI
    unreachable)".
  - This is the only external call, and it goes to the user's own LAN server, as the user asked.
- **Large vs small:** **₹10,000** threshold (configurable).
  - Large: a fresh AI audit.
  - Small: the latest stored report for that vendor, **score + top 3 points only**.
  - If a small payment has no prior report, run a quick deterministic check and say so.
- **Fee:** fixed, **computed once per (user, vendor)** from history, then stored (so it stays fixed):

  | Tier | Rule | Fee |
  |---|---|---|
  | first-time | 0 past payments | ₹9 |
  | occasional | 1–9 past payments | ₹5 |
  | frequent | ≥ 10 past payments | ₹2 |

  Always shown as "SIMULATED FEE — not charged".
- **Privacy to the AI:** the vendor GSTIN is masked (`29AAB•••••1Z5`) and the settlement account shows its last 4
  digits only. Customer names are never sent: the AI gets aggregates only (counts, sums, dispute rate, account age).
  The AI is told in its system prompt to maintain vendor privacy and not reproduce identifiers.
- **Wording rules still apply:** "Suspicious / Potentially risky / Multiple warning signals detected", never
  certainty. No PIN, OTP, password or card fields; a scan never pays; every screen is DEMO / SIMULATION.

## Relational schema (bank-style)
- `customers(id, name, kyc_level, created_at)`
- `accounts(id, customer_id, masked_no, balance_demo, ai_audit_enabled, audit_optout_ack_at)`
- `vendors(id, name, brand_color, category, size[enterprise|sme|micro], city, lat, lng, vpa, gstin_masked,
  settlement_last4, kyc_status, verified, onboarded_at, impostor_of NULL)`
- `transactions(id, account_id, vendor_id, amount, channel, status[simulated], created_at)`
- `disputes(id, transaction_id, reason, status, created_at)`
- `audit_reports(id, transaction_ref, account_id, vendor_id, amount, score, verdict, level, summary, reasons_json,
  vendor_issues_json, security_issues_json, data_used_json, reasoning_json, model, source[ai|simulated], fee,
  fee_tier, created_at)`
- `audit_fees(account_id, vendor_id, tier, fee, fixed_at)`, primary key (account_id, vendor_id)
- `audit_log(id, at, actor, action, detail)` — append-only

Seed: 1 demo customer and account; about 14 vendors (7 brands, 4 small vendors, 3 impostors) with lat/lng across India
(Bengaluru, Mumbai, Delhi, Chennai, Hyderabad, Kolkata, Pune, Jaipur); about 300 past simulated transactions; a few
disputes on the impostor vendors.

## API (FastAPI, shared by all three apps)
| Endpoint | Purpose |
|---|---|
| `GET /api/bank/vendors` | Vendors, map pins, latest score |
| `GET /api/bank/vendors/{id}` | Vendor profile, public stats, QR payload |
| `POST /api/bank/audit` | Body `{vendorId, amount, device}`. Large: an AI audit, stored. Small: the prior report summary. Returns `{mode: full\|summary, report, fee}` |
| `GET /api/bank/audits?after=` | The Auditor portal's live feed (full reasoning, server side) |
| `GET /api/bank/audits/{id}` | One full report |
| `GET` / `POST /api/bank/settings` | `{aiAuditEnabled, acknowledged}`. Turning it off requires `acknowledged: true` (else 409 with the warning text) |
| `GET /api/bank/db` | Engine in use (postgres / sqlite) and row counts, for the "database" badge |

Vendor QR payload: `PAYRAKSHA://demo-payment\nrecipient=<vpa>\namount=<n>\nmerchant=<name>\nvendorId=<id>\n...`, so the
existing engine and RakshaPay keep working. RakshaPay calls `/api/bank/audit` when `vendorId` is present.

## UIs
- **① Banking app `/vendors`:**
  - a dark India map (inline SVG outline, pins in brand colours, pulsing on a live scan);
  - a vendor side panel: monogram, verified badge, stats, **payment QR** (amount chips ₹499 / ₹4,999 / ₹24,999 / ₹74,999);
  - the latest audit score;
  - a settings card for the AI Audit service, with the fee table and the opt-out warning modal.
- **② RakshaPay:**
  - after scanning a vendor QR: a **"Bank AI audit"** card showing the fee, then either the full score and verdict
    (large) or the summary with "details kept private" (small);
  - Profile gets an AI-audit toggle with the same bank warning sheet.
- **③ AI Auditor portal (9182):**
  - a left rail with the audit queue;
  - the main area shows, for each report:
    - a score gauge and verdict banner;
    - a **"Data used"** block: tables → fields → values, masked;
    - numbered **reasoning steps**, then vendor issues, security issues, recommendation, privacy note and model/latency;
  - a "SERVER-SIDE · BANK INTERNAL · DEMO" chrome.

## Build order (cut from the bottom if time runs out)
1. DB layer + schema + seed + SQLite fallback + docker-compose. *(core)*
2. AI client + audit service (large / small / fee / opt-out) + API + pytest for the core path. *(core)*
3. Auditor portal on port 9182 (the reasoning UI). *(core)*
4. Banking app `/vendors` map + vendor panel + QR + settings / opt-out. *(core)*
5. RakshaPay audit card + profile toggle. *(core)*
6. Launcher: a third port, `--audit-port`, in the banner; rebuild the exe. *(core for the demo)*
7. Handle the qa-pay / qa-link findings (only blockers).
8. Polish: pulse animations, a map legend, audit history charts. *(cut first)*

## Demo script
1. Open ① `/vendors`, pick **Flipkart**, and pick ₹74,999. Scan with the phone (②).
2. The phone shows the bank AI audit: fee ₹9 (first-time), score and verdict.
3. ③ shows the full reasoning with the data used.
4. Pick **amaz0n-mega-sale** (impostor), ₹24,999. The AI flags multiple warning signals.
5. Pick Flipkart ₹499 (small): the phone shows only the score and key points of the earlier report.
6. Turn the AI audit off in Profile: the bank warning appears, and after acknowledgement the service is off and logged.
