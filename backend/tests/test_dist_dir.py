"""Test PAYRAKSHA_DIST_DIR environment variable override for static file serving."""
import importlib
import os
import app.main
from fastapi.testclient import TestClient


def test_dist_dir_override(tmp_path, monkeypatch):
    # Create a fake dist directory with index.html containing the marker
    dist = tmp_path / "dist"
    dist.mkdir()
    (dist / "index.html").write_text(
        "<!doctype html><html><body>DIST-OVERRIDE-OK</body></html>",
        encoding="utf-8",
    )

    try:
        monkeypatch.setenv("PAYRAKSHA_DIST_DIR", str(dist))
        importlib.reload(app.main)

        client = TestClient(app.main.app)
        response = client.get("/")
        assert response.status_code == 200
        assert "DIST-OVERRIDE-OK" in response.text
    finally:
        monkeypatch.delenv("PAYRAKSHA_DIST_DIR", raising=False)
        importlib.reload(app.main)
