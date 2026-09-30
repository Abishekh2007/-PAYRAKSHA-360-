# VECTOR HACKS '26: evaluation guide

This page maps PAYRAKSHA 360 to the **official 100-mark evaluation criteria** and points to the evidence for each one: code, tests, screenshots and live demo steps.

> Everything the prototype shows is **SIMULATION / DEMO** data, disclosed as required by rule 5 ("Simulated data may be used … but it must be disclosed"). No real money, bank or UPI network is ever involved.

| # | Criterion | Marks | Where to look |
|---|---|---|---|
| 1 | [Problem Understanding & Relevance](#1-problem-understanding--relevance-10) | 10 | This page §1, [README §1](README.md#1-the-problem-and-our-reasoning) |
| 2 | [Innovation & Originality](#2-innovation--originality-20) | 20 | This page §2, [docs/ORIGINALITY.md](docs/ORIGINALITY.md) |
| 3 | [Technical Implementation](#3-technical-implementation-20) | 20 | [ARCHITECTURE.md](ARCHITECTURE.md), [docs/RISK_ENGINE.md](docs/RISK_ENGINE.md), [docs/API.md](docs/API.md) |
| 4 | [Working Prototype & Functionality](#4-working-prototype--functionality-20) | 20 | This page §4, [docs/TESTING.md](docs/TESTING.md), [README §5–7](README.md#5-walkthrough-the-phone-app-rakshapay) |
| 5 | [Feasibility & Scalability](#5-feasibility--scalability-10) | 10 | [docs/FEASIBILITY.md](docs/FEASIBILITY.md) |
| 6 | [Real-World Impact](#6-real-world-impact-10) | 10 | This page §6 |
| 7 | [Presentation & Demonstration](#7-presentation--demonstration-5) | 5 | [README §9 demo script](README.md#9-a-3-minute-demo-script) |
| 8 | [Q&A & Technical Understanding](#8-qa--technical-understanding-5) | 5 | [docs/JUDGE_QA.md](docs/JUDGE_QA.md) |

---

## 1. Problem Understanding & Relevance (10)

**Problem.** UPI scams in India work by building a believable *situation*: an official-sounding message, a QR or link, an unknown payee, time pressure, and often a live phone call or screen share. Each piece looks harmless on its own, and the victim authorises the payment themselves, so post-transaction fraud checks see a legitimate, PIN-authorised payment.

**Target users**

| User | Need |
|---|---|
| Everyday UPI users, especially first-time digital payers and the elderly | A clear "stop and check" moment **before** paying, in plain language |
| Bank fraud-operations teams | Live visibility of risky payment attempts and campaigns, with reasons they can act on |
| Bank merchant-risk teams | Fast, explainable review of suspicious merchants (look-alike brands, pending KYC, disputes) |

**Existing gap**

* Fraud detection usually runs **after** the money moves, and recovery is slow and uncertain.
* Warnings are generic ("Beware of fraud") rather than specific to *this* payment.
* Rule-based filters check one signal at a time; scams succeed through **combinations**.
* Black-box scores do not tell the user *why*, so users ignore them.
* The user's real-time context (on a call with the requester, sharing their screen) is never considered.

**Real-world need.** The one moment a victim can still be protected is between scanning a QR and confirming the payment. PAYRAKSHA 360 is built entirely around that moment.

## 2. Innovation & Originality (20)

What is new compared with common approaches (the rulebook notes that merely using AI is not innovation, so the innovation here is in the **design**):

| Common approach | PAYRAKSHA 360 |
|---|---|
| Detect fraud after the transaction | **Pre-payment** check: a scanned QR always opens a risk check, never a payment |
| One rule at a time (blocklists, keywords) | **Multi-signal fusion** of text, URL, QR payload, payee history, amount, channel and behaviour, with **combination bonuses** for known scam pairs (e.g. "Receive Money" QR + payment: +20) |
| Opaque ML score | **Explainable score**: every point is a named contribution; **Scam DNA** fingerprint; **attack chain** of the scam's stages |
| Static context | **User-supplied live context**: one-tap chips ("I'm on a call with them", "asked to share my screen") re-score instantly (70 → 75 → 88) |
| Same friction for every payment | **Friction proportional to risk**: LOW pays normally; HIGH makes *Cancel* the primary button, and paying needs a 3-second hold |
| Customer app and bank systems disconnected | **Live phone ↔ bank link**: every check on the phone appears on the bank console within about a second |
| AI verdicts stated as fact | **Never certain**: "Suspicious / Potentially risky / Multiple warning signals detected" |
| Cloud-only | **Offline-first**: the same engine runs in the browser (JS) and the server (Python), proven identical by 103 golden cases |

Distinctive features: Scam DNA, Scam Constellation, Attack Chain, What-If / Counterfactual ("what would make this safe?"), Elder Mode, an AI merchant auditor with evidence-backed red flags, and a 3D offline vendor map.

What we built versus what we reused is listed in [docs/ORIGINALITY.md](docs/ORIGINALITY.md).

## 3. Technical Implementation (20)

* **Architecture:** one FastAPI process serves three React/TypeScript apps (Bank Console 7480, RakshaPay 7481, AI Auditor 7482) plus a shared API. See [ARCHITECTURE.md](ARCHITECTURE.md).
* **Algorithm:** a deterministic weighted-feature engine with 10 factors, 13 combination patterns, lexicon cue groups, URL heuristics (look-alikes, risky TLDs, IP hosts, shorteners) and UPI/QR parsing. See [docs/RISK_ENGINE.md](docs/RISK_ENGINE.md).
* **Dual runtime with proof of parity:** `shared/reference/engine.mjs` (browser, offline) and `backend/app/engine.py` (server) replay 103 golden cases with identical output.
* **Live link:** a thread-safe in-memory event store with sequence numbers, polling, heartbeats, decisions and in-place re-scoring. See [docs/API.md](docs/API.md).
* **AI auditor:** an OpenAI-compatible LLM call over bank DB evidence (SQLAlchemy on Postgres with a SQLite fallback), a live reasoning stream, and a deterministic simulated auditor as fallback.
* **ML second opinion:** TF-IDF + logistic regression, shown separately and never altering the explainable score.
* **Phone features:** camera QR decoding (jsQR), gallery decoding, a PWA manifest, and HTTPS over Tailscale for the camera.
* **Packaging:** a single Windows exe (PyInstaller) serving all three apps; the file name selects the app.
* **Quality:** strict TypeScript, **305 Vitest + 140 pytest tests**, acceptance tests written before the implementation, and smoke/exe tests. See [docs/TESTING.md](docs/TESTING.md).

## 4. Working Prototype & Functionality (20)

The **core workflow works end-to-end live**, not as mock-ups:

1. The bank console presents a scam QR (Device Link page).
2. The phone app (RakshaPay) scans it with the camera, gallery, or *Scan what the console shows*.
3. The engine scores it (**70 · HIGH CAUTION**) with plain-language reasons.
4. The user adds context ("on a call") and the score updates live (**75**).
5. The user cancels; the outcome says *No money moved*.
6. The bank console mirrors every step in real time (toast, Device Link feed, Scam DNA, Attack Chain).
7. A safe merchant payment scores **18 · LOW** and completes the demo payment flow with the demo code.
8. The AI Auditor explains a look-alike merchant with evidence.

How to verify it yourself:

| Check | Command / action |
|---|---|
| Run it | `1-Bank-Console.exe` and `2-RakshaPay.exe`, or `npm run dev:all` |
| All tests | `npm test` · `npm run test:py` |
| The exe serves all ports and the phone → console link | `npm run test:exe` |
| Screenshots of every step | [README §5–7](README.md#5-walkthrough-the-phone-app-rakshapay), `docs/screenshots/` |

Simulated parts, disclosed: all payees, amounts, merchants, statistics and payments are demo data; the "payment" is a simulated record. The risk analysis, live link, QR decoding, database and AI audit are real, working code.

## 5. Feasibility & Scalability (10)

Summary (details in [docs/FEASIBILITY.md](docs/FEASIBILITY.md)):

* **Low cost:** the rules engine is CPU-cheap (no GPU, no per-check AI cost) and runs on-device offline.
* **Deployment path:** as an SDK or check-before-pay step inside existing UPI apps, and as a bank-side API for the console and merchant audits.
* **Maintainable:** all weights, lexicons and patterns live in JSON config, tested by golden cases; there is one engine spec with two runtimes.
* **Scale:** the stateless analysis API scales horizontally; the in-memory link store would become Redis/Kafka streams in production.

## 6. Real-World Impact (10)

* **Stops losses before they happen:** the check sits at the only point where the user can still say no.
* **Changes behaviour through understanding:** users see *why* ("You have never paid this payee", "Claims to be the electricity board but the payee is not verified"), which teaches them to recognise the next scam too.
* **Protects vulnerable users:** Elder Mode and the trusted-contact flow.
* **Helps banks:** a live view of attempted scams, campaign patterns and explainable merchant audits for faster action.
* **Keeps safe payments fast:** low-risk payments add no extra friction.

## 7. Presentation & Demonstration (5)

A structured 3-minute live demo is in [README §9](README.md#9-a-3-minute-demo-script), with screenshots of every step as a backup. Judge Mode in the console gives a guided tour.

## 8. Q&A & Technical Understanding (5)

Prepared answers to likely technical questions are in [docs/JUDGE_QA.md](docs/JUDGE_QA.md). Known limitations are stated openly in [docs/FEASIBILITY.md](docs/FEASIBILITY.md#limitations).

---

**Team PHOENIX:** ABISHEKH PRADHOSH M P A · SUHASHA V · YESWANT V
