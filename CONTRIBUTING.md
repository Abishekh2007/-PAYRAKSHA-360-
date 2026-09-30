# Contributing

## Setup

See [README §10](README.md#10-running-from-source). In short: `npm install`, create `backend/.venv` and install `backend/requirements.txt`, then run `npm run dev:all`.

## Before you open a pull request

```bash
npm run typecheck
npm test            # Vitest
npm run test:py     # pytest, including engine golden parity
npm run build
```

## Rules

* **Safety first.** Follow every rule in [SECURITY.md](SECURITY.md): no real payments, no PIN/OTP/password/CVV/card fields, and DEMO / SIMULATION labels on every screen. Language must never state certainty ("Suspicious", not "Fraud").
* **Change the engine in one place.** Weights, lexicons and patterns live in `shared/*.json`. Logic changes go into `shared/reference/engine.mjs` first and are then ported to `backend/app/engine.py`. Regenerate `shared/golden/golden.json` with `node shared/reference/gen-golden.mjs` and make sure `npm run test:py` passes.
* **Never edit `test/acceptance/` to make an implementation pass.** Those tests are the contract.
* **Offline fallbacks stay.** Any new external dependency needs an offline fallback so the demo never breaks.
* **Style.** The console follows [docs/development/redesign/STYLE.md](docs/development/redesign/STYLE.md); RakshaPay follows [docs/development/RAKSHAPAY_STYLE.md](docs/development/RAKSHAPAY_STYLE.md).
