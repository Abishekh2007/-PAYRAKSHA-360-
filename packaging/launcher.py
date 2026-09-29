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

    # ── Validate frontend build ─────────────────────────────────────────────
    if not (dist / "index.html").is_file():
        print(
            f'Frontend build not found at {dist}. Run "npm run build" first.'
        )
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

    # ── Import app ──────────────────────────────────────────────────────────
    print("Starting the protection engine... (the first launch can take 10-30 seconds)")
    sys.stdout.flush()

    from app.main import app  # noqa: PLC0415  (intentional late import)

    # ── Start health-polling thread ─────────────────────────────────────────
    t = threading.Thread(
        target=_health_poller, args=(port, args.no_browser), daemon=True
    )
    t.start()

    # ── Run server ──────────────────────────────────────────────────────────
    try:
        import uvicorn
        uvicorn.run(app, host="127.0.0.1", port=port, log_level="warning", access_log=False)
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
