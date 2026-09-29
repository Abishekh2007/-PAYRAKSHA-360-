import socket
from fastapi.testclient import TestClient
from app.main import app
from app.config import load_scenarios
from app.engine import scenario_input
from app.ml import ml_insight

client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["simulation"] is True
    assert "engine" in data
    assert "ml" in data

def test_analyze_utility_scam():
    scenarios = load_scenarios()["scenarios"]
    scam = next(s for s in scenarios if s["id"] == "utility_scam")
    inp = scenario_input(scam)
    response = client.post("/api/analyze", json=inp)
    assert response.status_code == 200
    data = response.json()
    assert data["score"] == 92
    assert data["level"] == "HIGH"
    assert data["engine"]["runtime"] == "python"
    assert data.get("ml") is not None
    assert data["ml"]["label"] == "scam-like"

def test_analyze_legit_anchors():
    scenarios = load_scenarios()["scenarios"]
    
    legit = next(s for s in scenarios if s["id"] == "legit_utility")
    response_legit = client.post("/api/analyze", json=scenario_input(legit))
    assert response_legit.json()["score"] == 12
    assert response_legit.json()["level"] == "LOW"

    cc = next(s for s in scenarios if s["id"] == "customer_care_scam")
    response_cc = client.post("/api/analyze", json=scenario_input(cc))
    assert response_cc.json()["score"] == 88

def test_analyze_empty():
    response = client.post("/api/analyze", json={})
    assert response.status_code == 200
    data = response.json()
    assert data["score"] == 14
    assert data.get("ml") is None

def test_analyze_invalid_body():
    response = client.post("/api/analyze", json=[])
    assert response.status_code == 422

    response = client.post("/api/analyze", json={"message": "a" * 6000})
    assert response.status_code == 413

def test_analyze_url(monkeypatch):
    def mock_create_connection(*args, **kwargs):
        raise socket.error("Network call attempted during test!")
    monkeypatch.setattr(socket, "create_connection", mock_create_connection)

    response = client.post("/api/analyze/url", json={"url": "http://kyc-update-verify.xyz/login"})
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert data["host"] == "kyc-update-verify.xyz"

    response_bad = client.post("/api/analyze/url", json={"url": "not a url"})
    assert response_bad.status_code == 200
    assert response_bad.json()["valid"] is False

def test_qr_parse():
    txt = "PAYRAKSHA://demo-payment\nrecipient=a@demo\namount=10\nmerchant=M"
    response = client.post("/api/qr/parse", json={"text": txt})
    assert response.status_code == 200
    assert response.json()["format"] == "payraksha"

def test_scenarios():
    response = client.get("/api/scenarios")
    assert response.status_code == 200
    scenarios = response.json()["scenarios"]
    assert any(s["id"] == "utility_scam" for s in scenarios)

def test_ml_insight_direct():
    kyc = ml_insight("Your KYC is expiring in 24 hours. Your account will be blocked. Click here to verify now.")
    assert kyc is not None
    assert kyc["scamProbability"] > 0.5

    dinner = ml_insight("Dinner was great, sending my share for the pizza")
    assert dinner is not None
    assert dinner["scamProbability"] < 0.5

def test_security_headers():
    response = client.get("/api/health")
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["Referrer-Policy"] == "no-referrer"
    assert response.headers["X-Simulation"] == "true"
