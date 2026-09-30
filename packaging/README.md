# PAYRAKSHA 360 — Windows Executable

## Building

```
npm run build:exe
```

Produces `release/PAYRAKSHA360.exe`. To skip the web build (e.g. when `dist/` is already current):

```
npm run build:exe -- --skip-web
```

## Testing

```
npm run test:exe
```

Starts the exe on port 8799, checks health, the SPA, a 3-D model asset, and a live analysis. Exits 0 on success.

## Running

Double-click `release/PAYRAKSHA360.exe`. The default browser opens automatically. Close the console window (or press **Ctrl+C**) to stop.

### Options

| Option | Description |
|---|---|
| `--port N` | Listen on port N instead of choosing the first free port in 8000-8020. |
| `--no-browser` | Start the server without opening the browser. |
| `--pay-port N` | Wait and use port N for the RakshaPay server. |
| `--lan` | Expose RakshaPay on all interfaces (0.0.0.0) for LAN access. |
| `--no-pay` | Start only the console server without RakshaPay. |

## Notes

* **Portable**: one file, runs on 64-bit Windows 10/11 with no Node.js or Python installed.
* **Loopback only**: binds exclusively to `127.0.0.1`; never reachable from the network.
* **First launch**: takes 10-30 seconds while Windows unpacks the bundle to a temp folder. Subsequent launches are faster from the OS disk cache.
* **SmartScreen / Defender**: the exe is unsigned, so Windows may show a "SmartScreen protected your PC" prompt. Click *More info → Run anyway* to proceed.
* **SIMULATION / DEMO only**: PAYRAKSHA 360 scores payment-scam risk for educational purposes. It never initiates, authorises, or forwards a real payment, and makes no outbound network calls.
