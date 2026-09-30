# PAYRAKSHA 360
### Think Before You Pay.
**An Explainable AI Pre-Payment Scam Defense System**

**DEMO ENVIRONMENT — NO REAL PAYMENTS. Hackathon demonstration prototype: it never initiates, authorizes or simulates a real UPI/bank transaction, never asks for a UPI PIN, OTP, password or CVV, and all recipients, amounts, QR codes and alerts are demo data.**

---

## 1. The Idea

Most conventional fraud detection systems ask "Was this transaction fraudulent?" retrospectively after financial loss has already occurred. PAYRAKSHA 360 shifts the paradigm by asking "Does this payment situation make sense BEFORE you pay?" It holistically connects diverse multi-modal signals—including message copy, payment URLs, QR payloads, recipient histories, payment amounts, communication channels, and user behavioural anomalies—into an explainable 0–100 risk score. It surfaces underlying scam patterns, Scam DNA structural traits, and attack chain progressions before recommending safe, actionable next steps.

---

## 2. Feature Tour

PAYRAKSHA 360 is built as a Single Page Application using `HashRouter` (`#/route`). Every route in the application is outlined below:

| Route | View / Feature | Description |
|---|---|---|
| `#/` | Home | Hero landing page introducing PAYRAKSHA 360, core principles, and quick analysis entry points. |
| `#/live` | Live Protection | Real-time multi-signal payment analysis dashboard with instant risk breakdown. |
| `#/qr` | Scan QR | Scans or uploads QR codes to inspect raw payment intents, verify recipient handles, and detect redirection. |
| `#/message` | Analyze Message | Analyzes SMS, WhatsApp, and email copy for urgency cues, authority impersonation, and social engineering threats. |
| `#/url` | Analyze URL | Evaluates domain age, typo-squatting, misleading paths, and deceptive TLDs without external network requests. |
| `#/payment` | Payment Risk | Evaluates recipient novelty, amount anomalies against baselines, and communication context mismatches. |
| `#/lab` | Scam Lab | Interactive playground to load pre-configured scenarios and inspect multi-signal evaluation matrices. |
| `#/threat-intel` | Threat Intelligence | Visualizes simulated scam trends, active scam categories, and common attack patterns across regions. |
| `#/privacy` | Privacy | Outlines zero-trust privacy guarantees, local processing capabilities, and data protection boundaries. |
| `#/simulation` | Live Attack Simulation | Demonstrates step-by-step how multi-stage social engineering attacks unfold against unsuspecting users. |
| `#/dna` | Scam DNA | Visualizes structural fingerprint attributes of detected threats across urgency, authority, and channel mismatch. |
| `#/attack-chain` | Attack Chain | Maps the end-to-end cyber kill chain from initial lure and channel switch to the fraudulent payment trap. |
| `#/explain` | Risk Explanation | Deconstructs the explainable mathematical scoring formula, factor contributions, and active combination bonuses. |
| `#/what-if` | What-If Simulator | Interactive adjustment tool to toggle risk variables and observe real-time recalculations in the risk score. |
| `#/counterfactual` | Counterfactual AI | Pinpoints the exact minimal modifications required to transform a high-risk situation into a safe, legitimate payment. |
| `#/signals` | Signals Connected | Visual network graph showing how isolated benign/suspicious cues correlate into a high-confidence threat. |
| `#/trusted` | Trusted Contact | Family and trusted circle safety escalation workflow to seek second opinions before sending funds. |
| `#/elder` | Elder Mode | High-contrast, large-font, plain-language assisted safety interface designed for senior citizens. |
| `#/report` | Incident Report | Generates structured incident summary documentation for law enforcement or institutional record-keeping. |
| `#/dashboard` | Safety Dashboard | High-level overview of payment safety metrics, protected transactions, and detected scam trends. |
| `#/qr-generator` | QR Generator | Generates test UPI QR codes across various scam and legitimate scenarios for testing purposes. |
| `#/demo-control` | Demo Control Center | Quick-switching demo presets and state overrides designed for evaluators and presenters. |
| `#/technology` | About / Technology | Technical deep-dive into engine architecture and dual-runtime parity. |
| `#/judge` | Judge Mode | Curated 3-minute evaluation walkthrough demonstrating core scam detection capabilities. |
| `#/technical` | Technical View | Developer console displaying raw JSON payloads, benchmark execution times, and engine telemetry. |

---

## 3. The 3-Minute Judge Demo

The `/judge` route (accessible via `#/judge`) provides a structured 3-minute walkthrough illustrating PAYRAKSHA's multi-signal intelligence:

* **Act 1: The Scam (QR001 Electricity Bill Scam)**
  * Demonstrates an incoming WhatsApp message claiming imminent electricity disconnection.
  * Risk Score: **92/100 HIGH RISK** with an explicit **"DON'T PAY YET"** protective verdict.
  * Identifies combined signals: extreme urgency cues, unverified personal VPA claiming board authority, context channel mismatch, and excessive amount anomaly.
* **Act 2: The Legitimate Bill**
  * Demonstrates an authentic electricity bill notification from an official channel with verified merchant details.
  * Risk Score: **12/100 LOW RISK** (Baseline safe level), explaining why the context is valid.
* **Act 3: Signals Connected**
  * Demonstrates progressive compounding risk evaluation as individual signals are discovered:
    * Isolated Message Urgency: **45**
    * Adding Unverified VPA Recipient: **66**
    * Adding Channel Context Mismatch (WhatsApp for Utility): **77**
    * Adding Behavioural Pressure / Remote App Activity: **85**
* **Supporting Interactive Capabilities:**
  * **Counterfactual AI:** Demonstrates how changing payment parameters step-by-step safely de-escalates the risk (**92 → 62 → 39 → 24**).
  * **Live Attack Simulation:** Replays social engineering steps in real time.
  * **Trusted Contact & Elder Mode:** Shows inclusive accessibility and delegated human-in-the-loop protection.

---

## 4. Architecture

PAYRAKSHA 360 is engineered as a zero-dependency, ultra-resilient hybrid system featuring dual parity runtimes:

* **Frontend:** React 19 SPA with TypeScript, Vite, Tailwind CSS, Framer Motion, Zustand state management, and hand-drawn SVG visualisations (radar, payment twin, constellation) in a SOC console design.
* **Primary Risk Engine:** FastAPI Python service executing contextual scoring, NLP cue extraction, and pattern matching.
* **In-Browser Fallback Engine:** Built-in JavaScript reference engine (`shared/reference/engine.mjs`) loaded directly in the client, ensuring offline operation when the Python backend is unavailable.
* **Shared Configuration:** Unified configuration schemas (`shared/engine-config.json`, `shared/lexicon.json`, `shared/patterns.json`, `shared/recipients.json`, `shared/url-rules.json`) shared across both runtimes.
* **Golden Parity Testing:** The Python engine implementation is strictly validated against `shared/golden/golden.json` to guarantee bit-for-bit parity with the JavaScript reference engine.
* **ML Second Opinion:** Lightweight TF-IDF + Logistic Regression model trained on a synthetic demo corpus in Python; provides advisory context without altering the explainable rule-based score.
* **Simulated Intelligence:** All URL safety evaluations and threat lookups operate entirely via heuristic rule engines and local datasets—no outbound external network calls are made.

### System Architecture Diagram

```
+-------------------------------------------------------------------------------+
|                                PAYRAKSHA 360                                  |
+-------------------------------------------------------------------------------+
|                                                                               |
|  [ User Input: Message / QR / URL / Amount / Context / Behavioural Signals ]  |
|                                        |                                      |
|                                        v                                      |
|  +-------------------------------------------------------------------------+  |
|  |                    Frontend UI (React 19 + TypeScript)                  |  |
|  |      - Zustand Store   - Lucide Icons   - Framer Motion   - Three.js    |  |
|  +-------------------------------------------------------------------------+  |
|                         |                                  |                  |
|          (Default: Primary API Call)             (Fallback / Offline)         |
|                         v                                  v                  |
|  +-------------------------------------+   +-------------------------------+  |
|  |     FastAPI Backend (Python)        |   |   In-Browser Engine (JS)      |  |
|  |  - app/engine.py                    |   |   - shared/reference/         |  |
|  |  - app/ml.py (TF-IDF Advisory)      |   |     engine.mjs                |  |
|  +-------------------------------------+   +-------------------------------+  |
|                         \                                  /                  |
|                          \                                /                   |
|                           v                              v                    |
|  +-------------------------------------------------------------------------+  |
|  |                       Shared Configuration Layer                        |  |
|  |        engine-config.json | lexicon.json | patterns.json                |  |
|  |        recipients.json    | url-rules.json | golden.json                |  |
|  +-------------------------------------------------------------------------+  |
|                                        |                                      |
|                                        v                                      |
|  +-------------------------------------------------------------------------+  |
|  |                            Output Artifacts                             |  |
|  |    0-100 Risk Score  |  Scam DNA  |  Attack Chain  |  Safe Action Guide |  |
|  +-------------------------------------------------------------------------+  |
+-------------------------------------------------------------------------------+
```

---

## 5. Scoring Formula

The final risk score is computed through an explainable linear combination with non-linear combination boosts, clamped to `[0, 100]`:

$$\text{Score} = \min\left(100, \max\left(0, \text{Baseline} + \sum (\text{Weight}_i \times \text{FactorValue}_i) + \sum \text{CombinationBonuses}\right)\right)$$

* **Baseline:** `12`
* **Signal Factors & Weights:**
  * Recipient Novelty: `16`
  * Urgency Pressure: `15`
  * Behavioural Anomaly (e.g. on call, screen share): `14`
  * Impersonation Indicators: `12`
  * Suspicious URL Patterns: `10`
  * Amount Anomaly: `8`
  * Social Engineering Cues (threat, lure, secrecy): `8`
  * Context / Channel Mismatch: `8`
  * QR Redirection / Flag: `6`
  * Untrusted Channel Source: `3`

### Risk Classification Levels

* **0 – 29: LOW RISK** (Legitimate transaction context)
* **30 – 59: CAUTION** (Unusual parameters detected; review carefully)
* **60 – 79: HIGH CAUTION** (Multiple suspicious indicators present)
* **80 – 100: HIGH RISK** (Severe scam pattern matched; do not pay)

---

## 6. Getting Started

### Prerequisites
* Node.js 20+
* Python 3.13 (recommended)

### Installation & Environment Setup

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

2. **Set up Python backend virtual environment:**
   Create a virtual environment in `backend/.venv` and install the required dependencies:
   ```bash
   # Windows (Git Bash / PowerShell / Command Prompt)
   py -3.13 -m venv backend/.venv
   ./backend/.venv/Scripts/python -m pip install -r backend/requirements.txt
   ```
   *(On Unix/macOS: `python3.13 -m venv backend/.venv && ./backend/.venv/bin/pip install -r backend/requirements.txt`)*

### Running the Application

* **Run Full Stack (Frontend + FastAPI Backend):**
  ```bash
  npm run dev:all
  ```
  Launches the FastAPI backend on `http://127.0.0.1:8000` and Vite dev server on `http://localhost:5173`.

* **Run Frontend Only (In-Browser Engine Fallback):**
  ```bash
  npm run dev
  ```

* **Build & Serve Production Bundle via FastAPI:**
  ```bash
  npm run build
  npm run backend
  ```
  Serves the static bundle from `dist/` through FastAPI at `http://127.0.0.1:8000`.

### Running Tests & Quality Verification

* **Frontend & Unit Tests:**
  ```bash
  npm test
  ```
* **Python Backend & Golden Parity Tests:**
  ```bash
  npm run test:py
  ```
* **TypeScript Typecheck:**
  ```bash
  npm run typecheck
  ```
* **End-to-End Smoke Verification:**
  ```bash
  npm run smoke
  ```

---

## 7. Safety and Privacy Principles

1. **Zero Financial Operations:** PAYRAKSHA 360 never initiates, processes, forwards, or authorizes real UPI or banking transactions.
2. **Zero Credential Requests:** The system never asks for or stores sensitive secrets, including UPI PINs, bank passwords, OTPs, CVVs, or full debit/credit card numbers.
3. **No Direct Banking Links:** Operates without requiring live integrations or read permissions to real bank accounts.
4. **No Automated External Contact:** Does not automatically message or dial emergency contacts or phone numbers.
5. **Clear Data Marking:** All risk figures and threat indicators are explicitly marked as **SIMULATED HACKATHON DATA**.
6. **Disclaimed Output:** Any generated document is watermarked: `DEMO REPORT — NOT AN OFFICIAL CYBERCRIME REPORT`.
7. **Careful Linguistic Framing:** Risk findings describe "suspicious patterns", "anomalous indicators", or "multiple warning signals"—never claiming deterministic certainty.

---

## 8. Project Structure

```
payraksha-360/
├── backend/                  # FastAPI risk engine, Pydantic models, ML second opinion
│   ├── app/                  # Application endpoints, engine parity port, configuration loaders
│   ├── tests/                # Pytest suites verifying golden JSON parity
│   └── requirements.txt      # Python dependencies
├── public/                   # Static assets (favicon)
├── scripts/                  # Automation scripts (dev:all, smoke, backend, pytest)
├── shared/                   # Authoritative configuration & reference implementations
│   ├── reference/            # In-browser/Node.js reference risk engine
│   ├── golden/               # Golden cross-runtime parity dataset
│   └── *.json                # Shared weights, lexicons, URL heuristics, and scenarios
├── src/                      # React 19 SPA frontend
│   ├── components/           # Reusable UI widgets, SOC console kit, risk meters, layouts
│   ├── pages/                # Route page components (25 interactive views)
│   ├── routes.ts             # Central route registry and navigation definitions
│   └── main.tsx              # Application bootstrap
├── package.json              # NPM scripts and frontend dependencies
├── tsconfig.json             # TypeScript configuration
└── vite.config.ts            # Vite bundler configuration
```
