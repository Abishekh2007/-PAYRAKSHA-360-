# Originality and third-party disclosure

This document follows VECTOR HACKS '26 rule 4: it separates what the team built during the hackathon from the libraries, tools and data we reused.

## Built by the team for this hackathon

| Area | Our work |
|---|---|
| Product idea and design | Pre-payment "does this payment situation make sense?" check; risk-proportional friction; live phone ↔ bank link; the Scam DNA / attack-chain explanation model |
| Risk engine | Factor design, weights, lexicon cue groups, 13 combination patterns, URL heuristics, UPI/QR parsing, levels and explanations (`shared/*.json`, `shared/reference/engine.mjs`) plus the Python port (`backend/app/engine.py`) and the 103-case golden parity set |
| Bank Console | All pages and components in `src/`: Device Link, Command Center, shields, Scam DNA, Scam Constellation, Attack Chain, What-If, Counterfactual, Elder Mode, Incident Report, Vendor map, Judge Mode |
| RakshaPay phone app | All screens and logic in `pay/`: login, home, scan, risk check, context chips, hold-to-pay, outcomes, activity |
| AI Auditor | `auditor/` app, `backend/app/bank/`: evidence gathering from the bank DB, the prompt and response schema, the live reasoning stream and the simulated fallback |
| Backend | FastAPI apps and routers, the link store, the DB models and seed data, the ML second opinion |
| Packaging and tests | Windows launcher and exe, dev/build/smoke/exe scripts, 305 Vitest + 140 pytest tests |
| Demo data | All scenarios, demo payees, merchants and statistics (fictional, **SIMULATED HACKATHON DATA**) |

## Third-party libraries and assets (used, not claimed)

| Component | Used for | Licence |
|---|---|---|
| React, React Router, Vite, TypeScript | Front-end framework and tooling | MIT / Apache-2.0 |
| Tailwind CSS, PostCSS, Autoprefixer | Styling | MIT |
| framer-motion | Animations | MIT |
| zustand | State management | MIT |
| recharts | Charts (Scam DNA radar, bars) | MIT |
| lucide-react, simple-icons | Icons, brand glyphs for demo merchants | ISC / CC0 |
| jsQR, qrcode | QR decoding and generation | Apache-2.0 / MIT |
| Leaflet, react-leaflet | Optional online street map | BSD-2 / Hippocratic |
| @svg-maps/india | Offline India outline | CC BY 4.0 (attributed on the map) |
| Inter, Space Grotesk, JetBrains Mono (@fontsource) | Fonts | OFL-1.1 |
| FastAPI, Uvicorn, Pydantic, SQLAlchemy, psycopg | Backend | MIT / BSD / LGPL |
| scikit-learn, NumPy | ML second opinion | BSD-3 |
| Vitest, Testing Library, jsdom, pytest, httpx | Testing | MIT |
| PyInstaller | Packaging the exe | GPL with bootloader exception |
| OpenStreetMap tiles (optional online mode) | Street map | ODbL, © OpenStreetMap contributors |
| OmniRoute gateway + LLM (optional) | AI Auditor reasoning; the model is configurable via `PAYRAKSHA_AUDIT_MODEL` | External service, not part of this repo |

No pre-trained fraud model or real fraud dataset is used. The ML second opinion is trained at start-up on a small **synthetic** corpus generated from our own demo scenarios.

## AI-assisted development

Rule 4 allows AI-assisted development tools as long as this is disclosed. The team used **AI coding assistants** (Claude Code, plus multi-model coding workers) to write and review code, tests and documentation under the team's direction. The team defined the problem, the product and safety design, the scoring model, the demo scenarios and the acceptance criteria, and tested and demonstrated the result. The commit history shows how the project was developed.

## Simulated data

As required by rule 5, all payees, UPI IDs ending in `@demo`, merchants, amounts, transactions, statistics and reports are **simulated**. The prototype never connects to a real bank or UPI network and never moves money.
