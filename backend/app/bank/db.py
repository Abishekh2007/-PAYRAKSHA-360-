"""Bank-style relational store for the vendor-audit demo (SIMULATION ONLY).

Postgres (Docker, see docker-compose.yml) when reachable, otherwise SQLite, same schema, so the demo always runs.
Every row is simulated demo data. Brand names are used for a hackathon demo; the brands are not affiliated.
"""
from __future__ import annotations

import os
import random
import threading
from datetime import datetime, timedelta, timezone
from pathlib import Path

from sqlalchemy import (JSON, Boolean, Column, DateTime, Float, ForeignKey, Integer, MetaData, String, Table, Text,
                        create_engine, func, insert, select, text)
from sqlalchemy.engine import Engine

metadata = MetaData()

customers = Table('customers', metadata,
                  Column('id', String(40), primary_key=True),
                  Column('name', String(80), nullable=False),
                  Column('kyc_level', String(20), nullable=False),
                  Column('created_at', DateTime(timezone=True), nullable=False))

accounts = Table('accounts', metadata,
                 Column('id', String(40), primary_key=True),
                 Column('customer_id', String(40), ForeignKey('customers.id'), nullable=False),
                 Column('masked_no', String(24), nullable=False),
                 Column('balance_demo', Float, nullable=False),
                 Column('ai_audit_enabled', Boolean, nullable=False, default=True),
                 Column('audit_optout_ack_at', DateTime(timezone=True), nullable=True))

vendors = Table('vendors', metadata,
                Column('id', String(40), primary_key=True),
                Column('name', String(80), nullable=False),
                Column('brand_color', String(9), nullable=False),
                Column('category', String(40), nullable=False),
                Column('size', String(12), nullable=False),  # enterprise | sme | micro
                Column('city', String(40), nullable=False),
                Column('lat', Float, nullable=False),
                Column('lng', Float, nullable=False),
                Column('vpa', String(80), nullable=False),
                Column('gstin_masked', String(20), nullable=False),
                Column('settlement_last4', String(4), nullable=False),
                Column('kyc_status', String(20), nullable=False),  # verified | pending | failed
                Column('verified', Boolean, nullable=False),
                Column('onboarded_at', DateTime(timezone=True), nullable=False),
                Column('impostor_of', String(40), nullable=True))

transactions = Table('transactions', metadata,
                     Column('id', String(40), primary_key=True),
                     Column('account_id', String(40), ForeignKey('accounts.id'), nullable=False),
                     Column('vendor_id', String(40), ForeignKey('vendors.id'), nullable=False),
                     Column('amount', Float, nullable=False),
                     Column('channel', String(20), nullable=False),
                     Column('status', String(20), nullable=False),  # always 'simulated'
                     Column('created_at', DateTime(timezone=True), nullable=False))

disputes = Table('disputes', metadata,
                 Column('id', String(40), primary_key=True),
                 Column('transaction_id', String(40), ForeignKey('transactions.id'), nullable=False),
                 Column('reason', String(120), nullable=False),
                 Column('status', String(20), nullable=False),
                 Column('created_at', DateTime(timezone=True), nullable=False))

audit_reports = Table('audit_reports', metadata,
                      Column('id', Integer, primary_key=True, autoincrement=True),
                      Column('transaction_ref', String(60), nullable=False),
                      Column('account_id', String(40), nullable=False),
                      Column('vendor_id', String(40), ForeignKey('vendors.id'), nullable=False),
                      Column('amount', Float, nullable=False),
                      Column('device', String(40), nullable=False),
                      Column('kind', String(12), nullable=False),  # full | quick
                      Column('status', String(12), nullable=False),  # running | done
                      Column('score', Integer, nullable=True),
                      Column('verdict', String(20), nullable=True),
                      Column('headline', String(200), nullable=True),
                      Column('summary', Text, nullable=True),
                      Column('reasoning', JSON, nullable=True),
                      Column('vendor_issues', JSON, nullable=True),
                      Column('security_issues', JSON, nullable=True),
                      Column('recommendation', Text, nullable=True),
                      Column('privacy_note', Text, nullable=True),
                      Column('data_used', JSON, nullable=True),
                      Column('model', String(60), nullable=True),
                      Column('source', String(20), nullable=True),  # ai | simulated
                      Column('latency_ms', Integer, nullable=True),
                      Column('fee', Float, nullable=False),
                      Column('fee_tier', String(20), nullable=False),
                      Column('created_at', DateTime(timezone=True), nullable=False))

audit_fees = Table('audit_fees', metadata,
                   Column('account_id', String(40), primary_key=True),
                   Column('vendor_id', String(40), primary_key=True),
                   Column('tier', String(20), nullable=False),
                   Column('fee', Float, nullable=False),
                   Column('fixed_at', DateTime(timezone=True), nullable=False))

audit_log = Table('audit_log', metadata,
                  Column('id', Integer, primary_key=True, autoincrement=True),
                  Column('at', DateTime(timezone=True), nullable=False),
                  Column('actor', String(40), nullable=False),
                  Column('action', String(40), nullable=False),
                  Column('detail', Text, nullable=False))

DEMO_ACCOUNT = 'acc_demo_001'
NOW = lambda: datetime.now(timezone.utc)  # noqa: E731

# id, name, colour, category, size, city, lat, lng, vpa, kyc, verified, onboarded days ago, impostor_of,
# (demo customer's past payments), (network payments), dispute rate
VENDORS = [
    ('amazon', 'Amazon', '#FF9900', 'Marketplace', 'enterprise', 'Hyderabad', 17.44, 78.38, 'amazon.pay@demo', 'verified', True, 3100, None, 14, 60, 0.01),
    ('flipkart', 'Flipkart', '#2874F0', 'Marketplace', 'enterprise', 'Bengaluru', 12.93, 77.62, 'flipkart.store@demo', 'verified', True, 2900, None, 0, 55, 0.01),
    ('myntra', 'Myntra', '#FF3F6C', 'Fashion', 'enterprise', 'Bengaluru', 13.03, 77.70, 'myntra.store@demo', 'verified', True, 2500, None, 4, 30, 0.02),
    ('zomato', 'Zomato', '#E23744', 'Food delivery', 'enterprise', 'Gurugram', 28.46, 77.03, 'zomato.order@demo', 'verified', True, 2700, None, 22, 45, 0.01),
    ('nykaa', 'Nykaa', '#FC2779', 'Beauty', 'enterprise', 'Mumbai', 19.10, 72.85, 'nykaa.store@demo', 'verified', True, 2200, None, 2, 25, 0.02),
    ('reliance-digital', 'Reliance Digital', '#0A3A8C', 'Electronics', 'enterprise', 'Navi Mumbai', 19.03, 73.03, 'reliancedigital@demo', 'verified', True, 3300, None, 1, 20, 0.01),
    ('bigbasket', 'BigBasket', '#84C225', 'Groceries', 'enterprise', 'Chennai', 13.08, 80.27, 'bigbasket.order@demo', 'verified', True, 2600, None, 11, 40, 0.01),
    ('sharma-electronics', 'Sharma Electronics', '#14B8A6', 'Electronics store', 'sme', 'Delhi', 28.65, 77.23, 'sharma.electronics@demo', 'verified', True, 900, None, 3, 18, 0.03),
    ('anna-idli', 'Anna Idli Corner', '#F59E0B', 'Restaurant', 'micro', 'Chennai', 12.98, 80.22, 'anna.idli@demo', 'verified', True, 1200, None, 6, 25, 0.0),
    ('kolkata-sweets', 'Kolkata Sweets House', '#A855F7', 'Sweets', 'micro', 'Kolkata', 22.57, 88.36, 'kolkata.sweets@demo', 'verified', True, 1500, None, 0, 15, 0.0),
    ('jaipur-crafts', 'Jaipur Handicrafts Emporium', '#EC4899', 'Handicrafts', 'sme', 'Jaipur', 26.91, 75.79, 'jaipur.crafts@demo', 'verified', True, 700, None, 1, 12, 0.04),
    ('amaz0n-mega-sale', 'amaz0n Mega Sale', '#F97316', 'Unknown seller', 'micro', 'Kolkata', 22.66, 88.45, 'amaz0n-mega-sale@demo', 'pending', False, 9, 'amazon', 0, 14, 0.36),
    ('flipkart-refund-desk', 'Flipkart Refund Desk', '#3B82F6', 'Refund services', 'micro', 'Pune', 18.52, 73.86, 'flipkart-refund-desk@demo', 'failed', False, 4, 'flipkart', 0, 9, 0.44),
    ('quickloan-gadgets', 'QuickLoan Gadgets', '#EF4444', 'Electronics (EMI)', 'micro', 'Hyderabad', 17.39, 78.49, 'quickloan.gadgets@demo', 'pending', False, 21, None, 0, 16, 0.25),
]

TICKET = {'enterprise': (300, 6000), 'sme': (500, 15000), 'micro': (80, 1200)}

_lock = threading.Lock()
_engine: Engine | None = None
_backend = 'sqlite'


def _sqlite_path() -> Path:
    if os.environ.get('PAYRAKSHA_BANK_DB'):
        return Path(os.environ['PAYRAKSHA_BANK_DB'])
    return Path.home() / '.payraksha' / 'bank.db'


def _make_engine() -> tuple[Engine, str]:
    url = os.environ.get('PAYRAKSHA_DB_URL', 'postgresql+psycopg://payraksha:payraksha@127.0.0.1:5433/payraksha_bank')
    if url.startswith('postgresql') and os.environ.get('PAYRAKSHA_DB', '') != 'sqlite':
        try:
            eng = create_engine(url, pool_pre_ping=True, connect_args={'connect_timeout': 2})
            with eng.connect() as c:
                c.execute(text('select 1'))
            return eng, 'postgres'
        except Exception:
            pass
    path = _sqlite_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    return create_engine(f'sqlite:///{path}', connect_args={'check_same_thread': False}), 'sqlite'


def get_engine() -> Engine:
    global _engine, _backend
    with _lock:
        if _engine is None:
            _engine, _backend = _make_engine()
            metadata.create_all(_engine)
            with _engine.begin() as c:
                if c.execute(select(func.count()).select_from(vendors)).scalar() == 0:
                    _seed(c)
        return _engine


def backend_name() -> str:
    get_engine()
    return _backend


def log(c, actor: str, action: str, detail: str) -> None:
    c.execute(insert(audit_log).values(at=NOW(), actor=actor, action=action, detail=detail[:2000]))


def _seed(c) -> None:
    rnd = random.Random(360)
    now = NOW()
    c.execute(insert(customers), [
        {'id': 'cus_demo', 'name': 'Demo User', 'kyc_level': 'full', 'created_at': now - timedelta(days=1400)},
        *[{'id': f'cus_net_{i}', 'name': f'Network customer {i}', 'kyc_level': 'full', 'created_at': now - timedelta(days=400 + i * 30)}
          for i in range(1, 7)],
    ])
    c.execute(insert(accounts), [
        {'id': DEMO_ACCOUNT, 'customer_id': 'cus_demo', 'masked_no': 'XXXX XXXX 4821', 'balance_demo': 184250.0,
         'ai_audit_enabled': True, 'audit_optout_ack_at': None},
        *[{'id': f'acc_net_{i}', 'customer_id': f'cus_net_{i}', 'masked_no': f'XXXX XXXX {1000 + i * 137}',
           'balance_demo': 50000.0, 'ai_audit_enabled': True, 'audit_optout_ack_at': None} for i in range(1, 7)],
    ])
    txs, dis = [], []
    n = 0
    for (vid, _name, _col, _cat, size, _city, _lat, _lng, _vpa, _kyc, _ver, age, _imp, mine, net, drate) in VENDORS:
        lo, hi = TICKET[size]
        for k in range(mine + net):
            n += 1
            acct = DEMO_ACCOUNT if k < mine else f'acc_net_{1 + k % 6}'
            days = rnd.uniform(0, min(age, 180))
            tid = f'txn_{n:05d}'
            txs.append({'id': tid, 'account_id': acct, 'vendor_id': vid, 'amount': round(rnd.uniform(lo, hi), 2),
                        'channel': rnd.choice(['upi-qr', 'upi-qr', 'upi-intent', 'card-demo']), 'status': 'simulated',
                        'created_at': now - timedelta(days=days)})
            if rnd.random() < drate:
                dis.append({'id': f'dsp_{n:05d}', 'transaction_id': tid, 'status': 'open',
                            'reason': rnd.choice(['Item not delivered', 'Refund never received', 'Charged twice',
                                                  'Seller unreachable', 'Fake product']),
                            'created_at': now - timedelta(days=max(0.0, days - 2))})
    c.execute(insert(vendors), [
        {'id': v[0], 'name': v[1], 'brand_color': v[2], 'category': v[3], 'size': v[4], 'city': v[5], 'lat': v[6],
         'lng': v[7], 'vpa': v[8], 'gstin_masked': f'{rnd.randint(10, 36)}AA{v[0][:1].upper()}•••••{rnd.randint(1, 9)}Z{rnd.randint(1, 9)}',
         'settlement_last4': f'{rnd.randint(1000, 9999)}', 'kyc_status': v[9], 'verified': v[10],
         'onboarded_at': now - timedelta(days=v[11]), 'impostor_of': v[12]} for v in VENDORS])
    c.execute(insert(transactions), txs)
    if dis:
        c.execute(insert(disputes), dis)
    log(c, 'system', 'seed', f'Seeded {len(VENDORS)} vendors, {len(txs)} simulated transactions, {len(dis)} disputes')


def reset_for_tests() -> None:
    """Drop the cached engine (tests point PAYRAKSHA_BANK_DB at a temp file)."""
    global _engine
    with _lock:
        if _engine is not None:
            _engine.dispose()
        _engine = None
