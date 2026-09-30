# RakshaPay DEMO

RakshaPay DEMO is the phone companion app for PAYRAKSHA 360, simulating a mobile payment experience that analyzes risk before a transaction.

## How to Run

1. **Development (Node.js)**
   Run `npm run dev:all` from the project root. This starts the backend, the Console on port 5173, and RakshaPay on port 5174.

2. **Executable (Windows)**
   Double-click the `PAYRAKSHA360.exe` file. The console will be served on port `P` (e.g., 8000), and RakshaPay will be served on the next available port `P+1` (e.g., 8001).

   You can override the ports using the command line:
   `PAYRAKSHA360.exe --port 8000 --pay-port 8091`

## Phone Access (Tailscale)

To access RakshaPay on your phone (which is necessary for the camera to work, as camera access requires HTTPS):

1. **Recommended: Tailscale Serve**
   Tailscale is recommended as it provides an HTTPS URL to your local dev environment.
   - Run `tailscale serve --bg <pay port>` (e.g., `tailscale serve --bg 8001`).
   - Open the provided URL (e.g., `https://<your-machine>.<tailnet>.ts.net`) on your phone.
   - To stop sharing, run `tailscale serve --https=443 off`.

2. **Quick LAN Alternative**
   If you don't need camera access (e.g., for manual entry), you can run with the `--lan` flag.
   - Run `PAYRAKSHA360.exe --lan`. RakshaPay will listen on all interfaces (`0.0.0.0`).
   - Access RakshaPay on your phone using your computer's Tailscale IP address: `http://<tailscale-ip>:<pay port>`. Note: Camera features will not work over HTTP.

## Safety Rules

- **SIMULATION ONLY**: This is a demo. No real payments are initiated, authorized, or forwarded.
- **NEVER use real data**: Do not enter a real UPI PIN, OTP, password, or real bank account numbers into this app.
- **Demo data only**: All risk scoring and scenarios are pre-configured demonstrations.
