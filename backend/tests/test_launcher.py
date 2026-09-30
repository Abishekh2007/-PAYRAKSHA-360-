import pytest
import importlib.util
from pathlib import Path
import json

def load_launcher():
    launcher_path = Path(__file__).parent.parent.parent / 'packaging' / 'launcher.py'
    spec = importlib.util.spec_from_file_location("launcher", str(launcher_path))
    launcher = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(launcher)
    return launcher

launcher = load_launcher()

def test_pick_pay_port():
    # requested free
    def is_free_true(p): return True
    assert launcher.pick_pay_port(8000, 8050, is_free_true) == 8050

    # requested busy
    def is_free_false(p): return False
    with pytest.raises(SystemExit) as e:
        launcher.pick_pay_port(8000, 8050, is_free_false)
    assert e.value.code == 2

    # auto skips busy ports
    def is_free_custom(p):
        return p == 8003
    assert launcher.pick_pay_port(8000, None, is_free_custom) == 8003

def test_bind_host():
    assert launcher.bind_host(True) == "0.0.0.0"
    assert launcher.bind_host(False) == "127.0.0.1"

def test_tailscale_phone_url():
    # good JSON with trailing dot
    class DummyRun:
        def __init__(self, stdout, returncode=0):
            self.stdout = stdout
            self.returncode = returncode

    def runner_good(args, capture_output, text, timeout):
        return DummyRun(json.dumps({"Self": {"DNSName": "laptop.tail1234.ts.net."}}))
    assert launcher.tailscale_phone_url(runner_good) == "https://laptop.tail1234.ts.net"

    # non-zero rc
    def runner_fail(args, capture_output, text, timeout):
        return DummyRun("error", 1)
    assert launcher.tailscale_phone_url(runner_fail) is None

    # raises FileNotFoundError
    def runner_fnf(args, capture_output, text, timeout):
        raise FileNotFoundError("not found")
    assert launcher.tailscale_phone_url(runner_fnf) is None

    # raises TimeoutExpired
    def runner_timeout(args, capture_output, text, timeout):
        import subprocess
        raise subprocess.TimeoutExpired(args, timeout)
    assert launcher.tailscale_phone_url(runner_timeout) is None

    # bad JSON
    def runner_bad_json(args, capture_output, text, timeout):
        return DummyRun("invalid json", 0)
    assert launcher.tailscale_phone_url(runner_bad_json) is None

    # empty DNSName
    def runner_empty(args, capture_output, text, timeout):
        return DummyRun(json.dumps({"Self": {"DNSName": ""}}), 0)
    assert launcher.tailscale_phone_url(runner_empty) is None

def test_banner_lines():
    # Regular
    lines = launcher.banner_lines("http://cli", "http://pay", 8091, "https://ts.net", False)
    text = "\n".join(lines)
    assert "tailscale serve --bg 8091" in text
    assert "Stop sharing: tailscale serve --https=443 off" in text
    assert "LAN mode:" not in text

    # LAN
    lines = launcher.banner_lines("http://cli", "http://pay", 8091, "https://ts.net", True)
    text = "\n".join(lines)
    assert "LAN mode:" in text
    assert "tailscale serve --bg 8091" not in text
    assert "Stop sharing" not in text
