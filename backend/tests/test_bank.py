"""Vendor payments + bank AI audit API (simulated AI, temp SQLite). DEMO."""
import time

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setenv('PAYRAKSHA_DB', 'sqlite')
    monkeypatch.setenv('PAYRAKSHA_BANK_DB', str(tmp_path / 'bank.db'))
    monkeypatch.setenv('PAYRAKSHA_AUDIT_AI', '0')
    from app.bank import db
    db.reset_for_tests()
    from app.main import app
    yield TestClient(app)
    db.reset_for_tests()


def _wait_done(client, rid):
    for _ in range(50):
        r = client.get(f'/api/bank/audits/{rid}').json()
        if r['status'] == 'done':
            return r
        time.sleep(0.1)
    raise AssertionError('audit never finished')


def test_vendors_and_fee_quote(client):
    r = client.get('/api/bank/vendors').json()
    assert len(r['vendors']) == 14 and r['database'] == 'sqlite'
    d = client.get('/api/bank/vendors/flipkart?amount=24999').json()
    assert d['feeQuote']['fee'] in (2, 5, 9)
    assert 'vendorId=flipkart' in d['qrText']


def test_large_impostor_audit_then_small_summary(client):
    r = client.post('/api/bank/audit', json={'vendorId': 'amaz0n-mega-sale', 'amount': 49999, 'device': 'test'}).json()
    assert r['mode'] == 'full'
    rep = _wait_done(client, r['report']['id'])
    assert rep['score'] >= 55
    full = client.get('/api/bank/audits').json()['audits'][0]
    assert full['reasoning'] and full['data_used']
    small = client.post('/api/bank/audit', json={'vendorId': 'amaz0n-mega-sale', 'amount': 499, 'device': 'test'}).json()
    assert small['mode'] == 'summary' and small['report']['score'] == rep['score']


def test_opt_out_needs_acknowledgement(client):
    assert client.post('/api/bank/settings', json={'aiAuditEnabled': False}).status_code == 409
    assert client.post('/api/bank/settings', json={'aiAuditEnabled': False, 'acknowledged': True}).status_code == 200
    r = client.post('/api/bank/audit', json={'vendorId': 'amazon', 'amount': 20000, 'device': 't'}).json()
    assert r['mode'] == 'off'
    client.post('/api/bank/settings', json={'aiAuditEnabled': True})
