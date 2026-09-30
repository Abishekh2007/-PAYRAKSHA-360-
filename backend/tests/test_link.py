"""Tests for backend/app/link.py -- focused on seq bumping, re-check keeps id,
50-event cap, device online flag, target validation, and both apps sharing the store."""
import time
import pytest
from fastapi.testclient import TestClient
from app.main import app, pay_app
from app.link import reset_store

console = TestClient(app)
phone = TestClient(pay_app)

UTIL_QR = (
    "PAYRAKSHA://demo-payment\nrecipient=unknown-electricity@demo\namount=1999\n"
    "merchant=Electricity Board Demo\nsource=WhatsApp Demo\nurgency=true\n"
    "recipientVerified=false\nscenario=utility_scam"
)


@pytest.fixture(autouse=True)
def _clean():
    reset_store()
    yield
    reset_store()


def _scan(client=None, device='TestPhone', source='camera', qr_text=None, replaces=None):
    if client is None:
        client = console
    body = {'device': device, 'source': source, 'input': {'qrText': qr_text or UTIL_QR}}
    if replaces is not None:
        body['replaces'] = replaces
    resp = client.post('/api/link/scan', json=body)
    assert resp.status_code == 200, resp.text
    return resp.json()


def test_seq_bumps_on_scan_and_decision():
    """seq increments on each new scan and on each decision."""
    r1 = _scan()
    assert r1['event']['seq'] == 1

    r2 = _scan()
    assert r2['event']['seq'] == 2

    ev_id = r1['event']['id']
    resp = console.post('/api/link/decision', json={'id': ev_id, 'decision': 'trusted'})
    assert resp.status_code == 200
    body = resp.json()
    assert body['event']['seq'] == 3
    assert body['simulation'] is True


def test_recheck_keeps_id():
    """Re-scanning with replaces= keeps the original id but bumps seq and resets decision."""
    r1 = _scan()
    orig_id = r1['event']['id']
    assert orig_id.startswith('lk_')

    # Give it a decision first
    console.post('/api/link/decision', json={'id': orig_id, 'decision': 'verify'})

    # Re-check
    r2 = _scan(replaces=orig_id)
    assert r2['event']['id'] == orig_id       # same id
    assert r2['event']['seq'] > r1['event']['seq']
    assert r2['event']['decision'] == 'pending'
    assert r2['event']['decidedAt'] is None


def test_50_event_cap():
    """The deque holds at most 50 events; oldest are discarded when full."""
    ids = []
    for i in range(51):
        r = _scan(device=f'Phone{i % 5}')
        ids.append(r['event']['id'])

    resp = console.get('/api/link/events?after=0')
    events = resp.json()['events']
    assert len(events) <= 50
    # The first id should have been evicted
    returned_ids = {e['id'] for e in events}
    assert ids[0] not in returned_ids
    assert ids[-1] in returned_ids


def test_device_online_flag():
    """A device is online immediately after a scan (last_seen < 10 s ago)."""
    _scan(device='MyPixel')
    resp = console.get('/api/link/events?after=0')
    body = resp.json()
    devices = {d['name']: d for d in body['devices']}
    assert 'MyPixel' in devices
    assert devices['MyPixel']['online'] is True


def test_target_validation():
    """UPI deep-links are rejected; clearing with null works; label limit applies."""
    # Set a valid target
    resp = console.post('/api/link/target', json={'qrText': UTIL_QR, 'label': 'My QR'})
    assert resp.status_code == 200
    body = resp.json()
    assert body['target']['qrText'] == UTIL_QR
    assert body['simulation'] is True

    # UPI link rejected
    resp2 = console.post('/api/link/target', json={'qrText': 'upi://pay?pa=test@upi'})
    assert resp2.status_code == 422

    # Case-insensitive UPI rejection
    resp3 = console.post('/api/link/target', json={'qrText': 'UPI:merchant@upi'})
    assert resp3.status_code == 422

    # Label too long
    resp4 = console.post('/api/link/target', json={'qrText': UTIL_QR, 'label': 'x' * 81})
    assert resp4.status_code == 422

    # Clear target
    resp5 = console.post('/api/link/target', json={'qrText': None})
    assert resp5.status_code == 200
    assert resp5.json()['target'] is None


def test_both_apps_share_store():
    """Events posted via the phone app are visible on the console app."""
    r = _scan(client=phone, device='PhoneA')
    ev_id = r['event']['id']

    resp = console.get('/api/link/events?after=0')
    event_ids = {e['id'] for e in resp.json()['events']}
    assert ev_id in event_ids


def test_reset_clears_everything():
    """POST /api/link/reset wipes events, seq and devices."""
    _scan(device='DevX')
    console.post('/api/link/reset')

    resp = console.get('/api/link/events?after=0')
    body = resp.json()
    assert body['events'] == []
    assert body['latestSeq'] == 0
    assert body['devices'] == []


def test_validation_errors():
    """Bad inputs return 422; oversized message returns 413."""
    # Missing device
    resp = console.post('/api/link/scan', json={
        'source': 'camera', 'input': {'qrText': UTIL_QR}
    })
    assert resp.status_code == 422

    # Invalid source
    resp = console.post('/api/link/scan', json={
        'device': 'P', 'source': 'invalid', 'input': {'qrText': UTIL_QR}
    })
    assert resp.status_code == 422

    # Empty input
    resp = console.post('/api/link/scan', json={
        'device': 'P', 'source': 'camera', 'input': {}
    })
    assert resp.status_code == 422

    # Oversized message
    resp = console.post('/api/link/scan', json={
        'device': 'P', 'source': 'camera', 'input': {'message': 'x' * 5001}
    })
    assert resp.status_code == 413

    # Replaces non-existent id
    resp = console.post('/api/link/scan', json={
        'device': 'P', 'source': 'camera',
        'input': {'qrText': UTIL_QR}, 'replaces': 'lk_notexist'
    })
    assert resp.status_code == 404
