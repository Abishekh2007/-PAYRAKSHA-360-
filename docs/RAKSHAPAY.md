# RakshaPay DEMO

RakshaPay DEMO is the phone companion app for PAYRAKSHA 360, simulating a mobile payment experience that analyzes risk before a transaction.

## How to Run

1. **Development (Node.js)**
   Run `npm run dev:all` from the project root. This starts the backend, the Console on port 5173, and RakshaPay on port 5174.

2. **Executable (Windows)**
   Double-click the `PAYRAKSHA360.exe` file. The console is served on port 7480, RakshaPay on 7481 and the AI Auditor on 7482.

   You can override the ports using the command line:
   `PAYRAKSHA360.exe --port 7480 --pay-port 7481 --audit-port 7482`

## Phone Access (Tailscale)

To access RakshaPay on your phone (which is necessary for the camera to work, as camera access requires HTTPS):

1. **Recommended: Tailscale Funnel**
   Tailscale provides an HTTPS URL for the local app.
   - Run `tailscale funnel --bg 7481` (or `tailscale serve --bg 7481` to limit it to your tailnet).
   - Open the provided URL (e.g., `https://<your-machine>.<tailnet>.ts.net`) on your phone.
   - To stop sharing, run `tailscale funnel --bg off`.

2. **Quick LAN Alternative**
   If you don't need camera access (e.g., for manual entry), you can run with the `--lan` flag.
   - Run `PAYRAKSHA360.exe --lan`. RakshaPay will listen on all interfaces (`0.0.0.0`).
   - Access RakshaPay on your phone using your computer's Tailscale IP address: `http://<tailscale-ip>:<pay port>`. Note: Camera features will not work over HTTP.

## Safety Rules

- **SIMULATION ONLY**: This is a demo. No real payments are initiated, authorized, or forwarded.
- **NEVER use real data**: Do not enter a real UPI PIN, OTP, password, or real bank account numbers into this app.
- **Demo data only**: All risk scoring and scenarios are pre-configured demonstrations.
