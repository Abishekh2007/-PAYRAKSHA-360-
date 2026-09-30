"""PAYRAKSHA 360 launcher: starts the FastAPI backend and opens the browser."""
from __future__ import annotations
import argparse
import multiprocessing
import os
import socket
import sys
import threading
import traceback
import urllib.request
import webbrowser
import subprocess
import json
import asyncio
from pathlib import Path


BANNER = """\
==============================================
 PAYRAKSHA 360  —  Think Before You Pay.
 An Explainable AI Pre-Payment Scam Defense System
 SIMULATION / DEMO ONLY: no real payments are made.
 Never enter a real UPI PIN, OTP or password.
=============================================="""


def _pause_if_tty():
    """Pause before exit if running in an interactive terminal (double-click)."""
    try:
        if sys.stdin and sys.stdin.isatty():
            input("Press Enter to close...")
    except Exception:
        pass


def _find_free_port(start: int, end: int) -> int:
    """Return the first free port in [start, end], or port 0 if all busy."""
    for p in range(start, end + 1):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                s.bind(("127.0.0.1", p))
                return p
            except OSError:
                continue
    # All busy: let OS assign
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def _port_is_free(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            s.bind(("127.0.0.1", port))
            return True
        except OSError:
            return False


def pick_pay_port(console_port: int, requested: int | None, is_free=_port_is_free) -> int:
    if requested is not None:
        if is_free(requested):
            return requested
        print(f"Port {requested} is already in use. Close the other program or start without --pay-port.")
        sys.stdout.flush()
        _pause_if_tty()
        sys.exit(2)
    for p in range(console_port + 1, console_port + 21):
        if is_free(p):
            return p
    print("Could not find a free port for RakshaPay.")
    sys.stdout.flush()
    _pause_if_tty()
    sys.exit(2)


def bind_host(lan: bool) -> str:
    return "0.0.0.0" if lan else "127.0.0.1"


def tailscale_phone_url(runner=subprocess.run) -> str | None:
    try:
        r = runner(['tailscale', 'status', '--json'], capture_output=True, text=True, timeout=2)
        if r.returncode != 0:
            return None
        data = json.loads(r.stdout)
        dns = data.get("Self", {}).get("DNSName")
        if dns and isinstance(dns, str):
            dns = dns.rstrip('.')
            if dns:
                return f"https://{dns}"
    except Exception:
        pass
    return None


def banner_lines(console_url, pay_url, pay_port, phone_url, lan) -> list[str]:
    lines = [
        f"Console: {console_url}",
        f"RakshaPay: {pay_url}",
        "Open RakshaPay on your phone (Tailscale):"
    ]

    if lan:
        lines.append(f"LAN mode: RakshaPay also listens on all interfaces (http://<tailscale-ip>:{pay_port}; the camera needs HTTPS, use tailscale serve)")
    else:
        host_url = phone_url if phone_url else "https://<this-machine>.<tailnet>.ts.net"
        lines.append(f"tailscale serve --bg {pay_port}")
        lines.append(f"then open {host_url}")
        lines.append("Stop sharing: tailscale serve --https=443 off")

    lines.append("SIMULATION ONLY — no real payments")
    return lines


def _health_poller(port: int, no_browser: bool) -> None:
    """Poll /api/health until 200, then show the ready message."""
    url = f"http://127.0.0.1:{port}/"
    health_url = f"http://127.0.0.1:{port}/api/health"
    for _ in range(240):  # 240 * 0.5s = 120s
        try:
            with urllib.request.urlopen(health_url, timeout=2) as r:
                if r.status == 200:
                    print(f"Ready: {url}")
                    print("Close this window (or press Ctrl+C) to stop PAYRAKSHA 360.")
                    sys.stdout.flush()
                    if not no_browser:
                        webbrowser.open(url)
                    return
        except Exception:
            pass
        import time
        time.sleep(0.5)
    print(f"WARNING: PAYRAKSHA 360 did not become ready at {url} within 120 s.")
    sys.stdout.flush()


async def _serve_all(servers):
    await asyncio.gather(*(x.serve() for x in servers))


def main() -> None:
    multiprocessing.freeze_support()

    print(BANNER)
    sys.stdout.flush()

    # ── Resolve base paths ──────────────────────────────────────────────────
    frozen = getattr(sys, "frozen", False)
    if frozen:
        base = Path(sys._MEIPASS)  # type: ignore[attr-defined]
    else:
        base = Path(__file__).resolve().parents[1]
        # Allow `python packaging/launcher.py` to find backend/app
        backend_dir = str(base / "backend")
        if sys.path and sys.path[0] != backend_dir:
            sys.path.insert(0, backend_dir)

    dist = base / "dist"
    pay_dist = base / "dist-pay"

    # ── Validate frontend build ─────────────────────────────────────────────
    if not (dist / "index.html").is_file():
        print(f'Frontend build not found at {dist}. Run "npm run build" first.')
        sys.stdout.flush()
        _pause_if_tty()
        sys.exit(1)

    os.environ["PAYRAKSHA_DIST_DIR"] = str(dist)

    # ── Parse arguments ─────────────────────────────────────────────────────
    parser = argparse.ArgumentParser(
        prog="PAYRAKSHA360",
        description="PAYRAKSHA 360 — pre-payment scam defense (simulation only)",
    )
    parser.add_argument("--port", type=int, default=None, help="Port to listen on")
    parser.add_argument("--no-browser", action="store_true", help="Don't open the browser")
    parser.add_argument("--pay-port", type=int, default=None, help="Port for RakshaPay")
    parser.add_argument("--lan", action="store_true", help="LAN mode for RakshaPay")
    parser.add_argument("--no-pay", action="store_true", help="Don't serve RakshaPay")
    args = parser.parse_args()

    if args.port is not None:
        if not _port_is_free(args.port):
            print(
                f"Port {args.port} is already in use. "
                "Close the other program or start without --port."
            )
            sys.stdout.flush()
            _pause_if_tty()
            sys.exit(2)
        port = args.port
    else:
        port = _find_free_port(8000, 8020)

    console_url = f"http://127.0.0.1:{port}"
    os.environ["PAYRAKSHA_CONSOLE_URL"] = console_url

    has_pay = not args.no_pay
    if has_pay and not (pay_dist / "index.html").is_file():
        print(f"RakshaPay build not found at {pay_dist}. Continuing without RakshaPay.")
        sys.stdout.flush()
        has_pay = False

    pay_port = None
    if has_pay:
        pay_port = pick_pay_port(port, args.pay_port)
        os.environ["PAYRAKSHA_PAY_DIST_DIR"] = str(pay_dist)
        pay_url = f"http://127.0.0.1:{pay_port}"
        os.environ["PAYRAKSHA_PAY_URL"] = pay_url
        os.environ["PAYRAKSHA_LAN"] = '1' if args.lan else '0'
        phone_url = tailscale_phone_url()
        if phone_url:
            os.environ["PAYRAKSHA_PHONE_URL"] = phone_url

        lines = banner_lines(console_url, pay_url, pay_port, phone_url, args.lan)
        for line in lines:
            print(line)
        sys.stdout.flush()

    # ── Import app ──────────────────────────────────────────────────────────
    print("Starting the protection engine... (the first launch can take 10-30 seconds)")
    sys.stdout.flush()

    if has_pay:
        from app.main import app, pay_app  # noqa: PLC0415
    else:
        from app.main import app  # noqa: PLC0415

    # ── Start health-polling thread ─────────────────────────────────────────
    t = threading.Thread(
        target=_health_poller, args=(port, args.no_browser), daemon=True
    )
    t.start()

    # ── Run server ──────────────────────────────────────────────────────────
    try:
        import uvicorn
        servers = [uvicorn.Server(uvicorn.Config(app, host="127.0.0.1", port=port, log_level="warning", access_log=False))]
        if has_pay:
            servers.append(uvicorn.Server(uvicorn.Config(pay_app, host=bind_host(args.lan), port=pay_port, log_level="warning", access_log=False)))

        asyncio.run(_serve_all(servers))
    except KeyboardInterrupt:
        print("Stopped.")
        sys.stdout.flush()
        sys.exit(0)
    except Exception:
        traceback.print_exc()
        print("PAYRAKSHA 360 could not start.")
        sys.stdout.flush()
        _pause_if_tty()
        sys.exit(1)


if __name__ == "__main__":
    main()
