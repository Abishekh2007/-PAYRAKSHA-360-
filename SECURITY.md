# Security, safety and privacy

PAYRAKSHA 360 is a **hackathon demonstration prototype**. Everything it shows is **SIMULATION / DEMO** data.

## Guarantees built into the code

| Rule | How it is enforced |
|---|---|
| No real payments | There is no payment integration of any kind. The "Pay (demo)" flow only writes a local record and a link event marked `paid_demo`. |
| QR scanning never pays | A decoded QR always opens the **check** screen. Payment is a separate, deliberate action after the risk result. |
| No secrets requested | No field anywhere accepts a UPI PIN, OTP, password, CVV or full card number, and tests assert this. The demo codes `3023` (login) and `2026` (payment) are fixed values checked locally in the browser; they are never stored or sent. |
| Real UPI IDs are analysis-only | Any recipient not ending in `@demo` is masked (`sh•••@okaxis`) and has no pay button. |
| No automatic contact | "Ask a trusted contact" and "Report" are simulations; nothing is sent to anyone. Reports are watermarked **DEMO REPORT — NOT AN OFFICIAL CYBERCRIME REPORT**. |
| No certainty claims | The engine and UI say "Suspicious", "Potentially risky", "Multiple warning signals detected", never "this is fraud". |
| No hidden network calls | URLs are analysed as text and never fetched. The only outbound calls are optional: the AI Auditor endpoint (`OMNIROUTE_BASE_URL`) and street-map tiles in the optional online map mode. Both fall back to offline behaviour. |
| Minimal data | The link store lives in memory (50 events) and is lost on restart. The phone keeps its demo activity in local storage and can reset it from Profile. |

## Network exposure

* By default the servers bind to `127.0.0.1` only.
* `--lan` binds RakshaPay to all interfaces, for phones on the same network.
* `tailscale funnel --bg 7481` publishes RakshaPay on the internet while it runs; `tailscale serve --bg 7481` limits it to your tailnet. Turn it off with `tailscale funnel --bg off`.
* There is no authentication beyond the demo login code, so do not expose the console port publicly.

## Secrets

No secrets are committed. `.env.example` lists the optional variables. The default `OMNIROUTE_API_KEY` value `payraksha-demo` is a placeholder for a local gateway.

## Reporting a problem

This is a student prototype. Please open a GitHub issue describing the problem, without including any real personal or banking data.
