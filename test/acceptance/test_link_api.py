import sys, re
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'backend'))

import pytest
from fastapi.testclient import TestClient
from app.main import app, pay_app
from app.link import reset_store

UTIL_QR = "PAYRAKSHA://demo-payment\nrecipient=unknown-electricity@demo\namount=1999\nmerchant=Electricity Board Demo\nsource=WhatsApp Demo\nurgency=true\nrecipientVerified=false\nscenario=utility_scam"
LEGIT_QR = "PAYRAKSHA://demo-payment\nrecipient=merchant@demo\namount=450\nmerchant=Demo Kirana Store\nsource=Known Merchant Demo\nscenario=legit_merchant"


@pytest.fixture(autouse=True)
def _clean():
    reset_store()
    yield
    reset_store()


console = TestClient(app)
phone = TestClient(pay_app)


def test_scan_util_qr():
    """Phone scans UTIL_QR with device and source."""
    resp = phone.post('/api/link/scan', json={
        'device': 'Test phone',
        'source': 'camera',
        'input': {'qrText': UTIL_QR}
    })
    assert resp.status_code == 200
    body = resp.json()
    assert body['simulation'] is True
    assert 'event' in body
    assert 'report' in body
    assert 'ml' in body
    event = body['event']

    assert event['device'] == 'Test phone'
    assert event['source'] == 'camera'
    assert event['input'] == {'qrText': UTIL_QR}
    assert event['score'] == 70
    assert event['level'] == 'HIGH_CAUTION'
    assert event['levelLabel'] == 'HIGH CAUTION'
    assert event['recipient'] == 'unknown-electricity@demo'
    assert event['amount'] == 1999
    assert event['headline'] == 'Potentially risky payment situation'
    assert event['decision'] == 'pending'
    assert event['decidedAt'] is None
    assert event['simulation'] is True
    assert re.match(r'^lk_[0-9a-f]{8}$', event['id'])
    assert event['seq'] == 1

    assert body['report']['score'] == 70
    assert body['report']['level'] == 'HIGH_CAUTION'


def test_console_sees_event():
    """Console sees the scanned event via events endpoint."""
    phone.post('/api/link/scan', json={
        'device': 'Test phone',
        'source': 'camera',
        'input': {'qrText': UTIL_QR}
    })

    resp = console.get('/api/link/events?after=0')
    assert resp.status_code == 200
    body = resp.json()
    assert body['simulation'] is True
    assert len(body['events']) == 1
    assert body['latestSeq'] == 1

    event = body['events'][0]
    assert re.match(r'^lk_[0-9a-f]{8}$', event['id'])
    assert event['seq'] == 1
    assert event['device'] == 'Test phone'

    assert len(body['devices']) == 1
    dev = body['devices'][0]
    assert dev['name'] == 'Test phone'
    assert dev['online'] is True
    assert 'lastSeen' in dev


def test_recheck_with_behaviour():
    """Re-check with behaviour context keeps same id, updates score."""
    scan_resp = phone.post('/api/link/scan', json={
        'device': 'Test phone',
        'source': 'camera',
        'input': {'qrText': UTIL_QR}
    })
    event_id = scan_resp.json()['event']['id']

    recheck_resp = phone.post('/api/link/scan', json={
        'device': 'Test phone',
        'source': 'gallery',
        'input': {'qrText': UTIL_QR, 'behaviour': {'onCall': True, 'screenShare': True}},
        'replaces': event_id
    })

    assert recheck_resp.status_code == 200
    body = recheck_resp.json()
    assert body['simulation'] is True
    event = body['event']

    assert event['id'] == event_id
    assert event['seq'] == 2
    assert event['score'] == 88
    assert event['level'] == 'HIGH'
    assert event['levelLabel'] == 'HIGH RISK'
    assert event['headline'] == 'Multiple warning signals detected'
    assert event['decision'] == 'pending'
    assert event['decidedAt'] is None

    resp = console.get('/api/link/events?after=0')
    body = resp.json()
    assert len(body['events']) == 1
    assert body['events'][0]['score'] == 88
    assert body['events'][0]['seq'] == 2

    resp = console.get('/api/link/events?after=1')
    body = resp.json()
    assert len(body['events']) == 1
    assert body['events'][0]['seq'] == 2

    resp = console.get('/api/link/events?after=2')
    body = resp.json()
    assert len(body['events']) == 0


def test_decision_endpoints():
    """Test decision endpoint with valid and invalid values."""
    scan_resp = phone.post('/api/link/scan', json={
        'device': 'Test phone',
        'source': 'camera',
        'input': {'qrText': UTIL_QR}
    })
    event_id = scan_resp.json()['event']['id']

    resp = phone.post('/api/link/decision', json={'id': event_id, 'decision': 'cancelled'})
    assert resp.status_code == 200
    body = resp.json()
    assert body['simulation'] is True
    event = body['event']
    assert event['decision'] == 'cancelled'
    assert event['decidedAt'] is not None
    assert isinstance(event['decidedAt'], str)
    assert event['seq'] == 2

    resp = phone.post('/api/link/decision', json={'id': event_id, 'decision': 'pay'})
    assert resp.status_code == 422

    resp = phone.post('/api/link/decision', json={'id': event_id, 'decision': 'pending'})
    assert resp.status_code == 422

    resp = phone.post('/api/link/decision', json={'id': 'lk_00000000', 'decision': 'cancelled'})
    assert resp.status_code == 404


def test_scan_legit_qr():
    """Scan LEGIT_QR and real UPI QR."""
    resp = phone.post('/api/link/scan', json={
        'device': 'Phone',
        'source': 'camera',
        'input': {'qrText': LEGIT_QR}
    })
    assert resp.status_code == 200
    body = resp.json()
    event = body['event']
    assert event['score'] == 13
    assert event['level'] == 'LOW'
    assert event['levelLabel'] == 'LOW RISK'
    assert event['recipient'] == 'merchant@demo'
    assert event['amount'] == 450

    upi_qr = "upi://pay?pa=shop@okaxis&pn=Shop&am=100"
    resp = phone.post('/api/link/scan', json={
        'device': 'Phone',
        'source': 'camera',
        'input': {'qrText': upi_qr}
    })
    assert resp.status_code == 200
    body = resp.json()
    event = body['event']
    assert event['score'] == 37
    assert event['level'] == 'CAUTION'
    assert event['levelLabel'] == 'CAUTION'
    assert event['recipient'] == 'shop@okaxis'
    assert event['amount'] == 100


def test_validation_errors():
    """Test input validation: device, source, input types and lengths."""
    resp = phone.post('/api/link/scan', json={
        'device': '',
        'source': 'camera',
        'input': {'qrText': UTIL_QR}
    })
    assert resp.status_code == 422

    resp = phone.post('/api/link/scan', json={
        'device': '   ',
        'source': 'camera',
        'input': {'qrText': UTIL_QR}
    })
    assert resp.status_code == 422

    device_41 = 'a' * 41
    resp = phone.post('/api/link/scan', json={
        'device': device_41,
        'source': 'camera',
        'input': {'qrText': UTIL_QR}
    })
    assert resp.status_code == 422

    resp = phone.post('/api/link/scan', json={
        'device': 'Phone',
        'source': 'fax',
        'input': {'qrText': UTIL_QR}
    })
    assert resp.status_code == 422

    resp = phone.post('/api/link/scan', json={'device': 'Phone', 'source': 'camera', 'input': {}})
    assert resp.status_code == 422

    resp = phone.post('/api/link/scan', json={
        'device': 'Phone',
        'source': 'camera',
        'input': {'message': 5}
    })
    assert resp.status_code == 422

    message_5001 = 'x' * 5001
    resp = phone.post('/api/link/scan', json={
        'device': 'Phone',
        'source': 'camera',
        'input': {'message': message_5001}
    })
    assert resp.status_code == 413

    scan_resp = phone.post('/api/link/scan', json={
        'device': 'Phone',
        'source': 'camera',
        'input': {'qrText': UTIL_QR}
    })
    event_id = scan_resp.json()['event']['id']

    resp = phone.post('/api/link/scan', json={
        'device': 'Phone',
        'source': 'camera',
        'input': {'qrText': UTIL_QR},
        'replaces': 'lk_deadbeef'
    })
    assert resp.status_code == 404


def test_cap_50_events():
    """Store keeps at most 50 events; seq continues past 50."""
    for i in range(1, 56):
        resp = phone.post('/api/link/scan', json={
            'device': 'Phone',
            'source': 'camera',
            'input': {'message': f'hello {i}'}
        })
        assert resp.status_code == 200
        assert resp.json()['event']['seq'] == i

    resp = console.get('/api/link/events?after=0')
    body = resp.json()
    assert len(body['events']) == 50
    assert body['latestSeq'] == 55

    seqs = [e['seq'] for e in body['events']]
    assert sorted(seqs) == seqs
    assert min(seqs) == 6
    assert max(seqs) == 55


def test_target_and_heartbeat():
    """Set console target and phone sees it via heartbeat."""
    console.post('/api/link/target', json={
        'qrText': UTIL_QR,
        'label': 'Electricity demo'
    })

    resp = phone.post('/api/link/heartbeat', json={'device': 'Phone'})
    assert resp.status_code == 200
    body = resp.json()
    assert body['ok'] is True
    assert body['simulation'] is True
    assert body['target']['qrText'] == UTIL_QR
    assert body['target']['label'] == 'Electricity demo'
    assert 'setAt' in body['target']

    resp = console.get('/api/link/events?after=0')
    body = resp.json()
    target = body['target']
    assert target['qrText'] == UTIL_QR
    assert target['label'] == 'Electricity demo'

    resp = console.post('/api/link/target', json={'qrText': 'UPI://pay?pa=x@y'})
    assert resp.status_code == 422

    console.post('/api/link/target', json={'qrText': None})

    resp = phone.post('/api/link/heartbeat', json={'device': 'Phone'})
    body = resp.json()
    assert body['target'] is None


def test_info_and_reset():
    """Info endpoint has expected keys; reset clears store."""
    resp = console.get('/api/link/info')
    assert resp.status_code == 200
    body = resp.json()
    assert 'consoleUrl' in body
    assert 'payUrl' in body
    assert 'phoneUrl' in body
    assert isinstance(body['lan'], bool)
    assert body['simulation'] is True

    phone.post('/api/link/scan', json={
        'device': 'Phone',
        'source': 'camera',
        'input': {'qrText': UTIL_QR}
    })

    console.post('/api/link/reset')

    resp = console.get('/api/link/events?after=0')
    body = resp.json()
    assert body['events'] == []
    assert body['latestSeq'] == 0
