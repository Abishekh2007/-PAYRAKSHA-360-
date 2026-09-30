# Judge Q&A: prepared technical answers

**Q: How is the risk score calculated?**
`score = clamp(0, 100, 12 + Σ round(weight × factor) + Σ combo bonuses)`. There are ten factors, each 0–1, with weights from 3 to 16, and 13 combination patterns. Levels: 0–29 LOW, 30–59 CAUTION, 60–79 HIGH CAUTION, 80–100 HIGH. See [RISK_ENGINE.md](RISK_ENGINE.md).

**Q: Why not just train a machine-learning model?**
Three reasons. We have no labelled real fraud data, and inventing accuracy numbers would be dishonest. A payment warning must say *why*; weighted contributions give an exact reason for each point. And a deterministic engine runs offline on the phone. We do include a TF-IDF + logistic-regression "second opinion", but it never changes the score. With real bank data, the weights could be learned (e.g. logistic regression over the same features) without changing the explanation model.

**Q: Why does the demo QR score exactly 70?**
Baseline 12 + unknown recipient 16 + impersonation 12 + urgency 8 + QR redirection 6 + context mismatch 6 + amount anomaly 4 + untrusted source 2 + the "Urgency + QR + Unknown Recipient" combo 4 = **70**. "On a call" adds behavioural anomaly 5 (→ 75). Adding screen share raises behavioural anomaly to 12 and triggers the "Remote Access + Payment Request" combo, +6 (→ 88).

**Q: What are combination bonuses and why use them?**
Scams succeed through pairs of signals that are individually weak. For example, "scan to *receive* money" plus a payment request is almost never legitimate (+20). A refund that requires you to pay is another (+8). The bonuses encode known scam playbooks.

**Q: How do the phone and bank console communicate?**
The phone posts each check to `POST /api/link/scan`. The server scores it and stores a sequenced event in a thread-safe in-memory store. The console polls `GET /api/link/events?after=<seq>` every second. Decisions and context re-checks update the same event. All three apps run in one process, so they share the store.

**Q: What happens if the server is down?**
The phone falls back to the JavaScript engine after 2.5 seconds, so the check still works offline. The golden test set guarantees that the JS and Python engines give identical results.

**Q: How do you keep the two engines in sync?**
`engine.mjs` is the reference. `gen-golden.mjs` records its output for 103 inputs, and `test_golden.py` requires the Python port to reproduce every case exactly.

**Q: How does the AI Auditor work, and what if the AI is wrong or unavailable?**
It collects evidence from the bank DB (look-alike of a known brand, KYC status, merchant age, dispute record, ticket size) and sends it to an OpenAI-compatible model, which must reply with a JSON object only. The auditor shows each red flag with its evidence plus the raw model output. If the model is unreachable, times out or returns bad JSON, a deterministic simulated auditor produces the report. The audit is advisory, for bank staff, and never blocks anything automatically.

**Q: How do you make sure the demo is safe?**
No payment integration exists at all. A scanned QR can only open a check screen. Non-`@demo` UPI IDs are masked and cannot be paid. No PIN/OTP/password/CVV/card field exists, and tests assert this. Demo codes are checked locally and never stored. See [SECURITY.md](../SECURITY.md).

**Q: Why does the camera need HTTPS?**
Browsers expose the camera only on secure origins. `localhost` counts as secure, but a phone reaching the laptop over the network does not. `tailscale funnel` (or `serve`) gives the laptop a valid HTTPS address.

**Q: What are the false-positive risks?**
A new but legitimate payee with an urgent message could score CAUTION. That is why CAUTION suggests *verify* rather than block, why the wording is never certain, and why the user can always proceed (after a deliberate hold for HIGH). Real deployment would calibrate the thresholds on bank data.

**Q: How would this scale to millions of users?**
Analysis is stateless and CPU-cheap, so it scales horizontally or runs on-device. The link store would move to Redis Streams/Kafka with WebSockets, and audits to a job queue. See [FEASIBILITY.md](FEASIBILITY.md).

**Q: What is original versus reused?**
See [ORIGINALITY.md](ORIGINALITY.md): the engine design, the scoring model, all apps and the demo data are ours; UI and backend frameworks are open-source libraries; AI coding assistants were used and are disclosed.
