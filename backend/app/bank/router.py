"""Vendor payments + AI bank audit API (SIMULATION ONLY: nothing is charged, paid or sent to a real bank)."""
from __future__ import annotations

import threading
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request
from sqlalchemy import func, insert, select, update

from app.config import load_config
from app.engine import analyze
from app.bank import db
from app.bank.ai import LIVE, run_ai_audit, simulated_audit, verdict_for

router = APIRouter(prefix='/api/bank')

LARGE_AMOUNT = 10000
FEE_TIERS = [  # (min past payments, tier, fee)
    (10, 'frequent', 2.0),
    (1, 'occasional', 5.0),
    (0, 'first-time', 9.0),
]
OPTOUT_WARNING = ('If you turn off the Bank AI Audit, the bank will no longer check vendor payments for you. '
                  'The bank will not take accountability or the risk for payments made without the audit; '
                  'you are responsible for verifying every vendor yourself. (DEMO / SIMULATION)')
VERDICT_LABEL = {'LIKELY_SAFE': 'Low risk', 'CAUTION': 'Caution', 'SUSPICIOUS': 'Suspicious',
                 'HIGH_RISK': 'Multiple warning signals detected'}


def _aware(d: datetime) -> datetime:
    return d if d.tzinfo else d.replace(tzinfo=timezone.utc)


def qr_payload(v: dict, amount: float = 0) -> str:
    """Merchant QR. amount=0 gives a static merchant QR: the customer enters the amount on RakshaPay."""
    amt = f"amount={int(amount)}\n" if amount else ''
    return (f"PAYRAKSHA://demo-payment\nrecipient={v['vpa']}\n{amt}merchant={v['name']}\n"
            f"vendorId={v['id']}\nsource=Vendor QR Demo\nrecipientVerified={'true' if v['verified'] else 'false'}\n"
            f"scenario=vendor_payment")


def _stats(c, vid: str) -> dict:
    t = db.transactions
    row = c.execute(select(func.count(), func.coalesce(func.sum(t.c.amount), 0), func.coalesce(func.avg(t.c.amount), 0))
                    .where(t.c.vendor_id == vid)).one()
    disputes = c.execute(select(func.count()).select_from(db.disputes.join(t, db.disputes.c.transaction_id == t.c.id))
                         .where(t.c.vendor_id == vid)).scalar()
    return {'txCount': row[0], 'volume': round(float(row[1]), 2), 'avgTicket': round(float(row[2]), 2),
            'disputes': disputes, 'disputeRatePct': round(100 * disputes / row[0], 1) if row[0] else 0.0}


def _my_history(c, vid: str) -> dict:
    t = db.transactions
    row = c.execute(select(func.count(), func.coalesce(func.sum(t.c.amount), 0), func.max(t.c.created_at))
                    .where(t.c.vendor_id == vid, t.c.account_id == db.DEMO_ACCOUNT)).one()
    return {'count': row[0], 'total': round(float(row[1]), 2), 'last': _aware(row[2]).date().isoformat() if row[2] else None}


def _fee(c, vid: str, fix: bool) -> dict:
    f = c.execute(select(db.audit_fees).where(db.audit_fees.c.account_id == db.DEMO_ACCOUNT,
                                              db.audit_fees.c.vendor_id == vid)).mappings().first()
    if f:
        return {'tier': f['tier'], 'fee': f['fee'], 'fixed': True, 'simulated': True}
    n = _my_history(c, vid)['count']
    tier, fee = next((tr, fe) for (mn, tr, fe) in FEE_TIERS if n >= mn)
    if fix:
        c.execute(insert(db.audit_fees).values(account_id=db.DEMO_ACCOUNT, vendor_id=vid, tier=tier, fee=fee,
                                               fixed_at=db.NOW()))
    return {'tier': tier, 'fee': fee, 'fixed': fix, 'simulated': True, 'basedOnPayments': n}


def _latest(c, vid: str):
    return c.execute(select(db.audit_reports).where(db.audit_reports.c.vendor_id == vid, db.audit_reports.c.status == 'done')
                     .order_by(db.audit_reports.c.id.desc()).limit(1)).mappings().first()


def _vendor_public(c, v, with_stats=True) -> dict:
    age = (db.NOW() - _aware(v['onboarded_at'])).days
    out = {'id': v['id'], 'name': v['name'], 'brandColor': v['brand_color'], 'category': v['category'], 'size': v['size'],
           'city': v['city'], 'lat': v['lat'], 'lng': v['lng'], 'vpa': v['vpa'], 'verified': v['verified'],
           'kycStatus': v['kyc_status'], 'vendorAgeDays': age}
    last = _latest(c, v['id'])
    out['latestAudit'] = ({'id': last['id'], 'score': last['score'], 'verdict': last['verdict'],
                           'at': _aware(last['created_at']).isoformat()} if last else None)
    if with_stats:
        out['stats'] = _stats(c, v['id'])
    return out


def _evidence(c, v, amount: float, device: str) -> dict:
    st = _stats(c, v['id'])
    st['vendorAgeDays'] = (db.NOW() - _aware(v['onboarded_at'])).days
    me = _my_history(c, v['id'])
    eng = analyze({'qrText': qr_payload(v, amount)}, load_config(), 'python')
    reasons = [x['label'] for x in sorted(eng.get('contributions') or [], key=lambda x: -x.get('points', 0))
               if x.get('kind') == 'factor' and x.get('points', 0) > 0][:5]
    prior = c.execute(select(func.count(), func.avg(db.audit_reports.c.score))
                      .where(db.audit_reports.c.vendor_id == v['id'], db.audit_reports.c.status == 'done')).one()
    return {
        'vendor': {'name': v['name'], 'category': v['category'], 'size': v['size'], 'city': v['city'],
                   'kycStatus': v['kyc_status'], 'verified': v['verified'], 'impostorOf': v['impostor_of'],
                   'gstin': v['gstin_masked'], 'settlementAccount': f"•••• {v['settlement_last4']}"},
        'vendorStats': st,
        'customerHistory': me,
        'payment': {'amount': amount, 'currency': 'INR', 'channel': 'upi-qr (simulated)', 'device': device,
                    'vsAvgTicket': round(amount / st['avgTicket'], 1) if st['avgTicket'] else None,
                    'hourLocal': datetime.now().hour},
        'engineSignals': {'score': eng['score'], 'level': eng['level'], 'reasons': reasons},
        'priorAudits': {'count': prior[0], 'avgScore': round(float(prior[1]), 1) if prior[1] is not None else None},
    }


def _data_used_view(ev: dict) -> list[dict]:
    """The evidence grouped by table, as the auditor portal shows it."""
    return [
        {'table': 'vendors', 'fields': ev['vendor']},
        {'table': 'transactions + disputes (vendor aggregate)', 'fields': ev['vendorStats']},
        {'table': 'transactions (this customer → vendor)', 'fields': ev['customerHistory']},
        {'table': 'payment request (QR)', 'fields': ev['payment']},
        {'table': 'rules engine', 'fields': ev['engineSignals']},
        {'table': 'audit_reports (prior)', 'fields': ev['priorAudits']},
    ]


def _finish(rid: int, rep: dict, source: str, model: str, ms: int) -> None:
    with db.get_engine().begin() as c:
        c.execute(update(db.audit_reports).where(db.audit_reports.c.id == rid).values(
            status='done', score=rep['score'], verdict=rep['verdict'], headline=rep['headline'], summary=rep['summary'],
            reasoning=rep['reasoning'], vendor_issues=rep['vendorIssues'], security_issues=rep['securityIssues'],
            recommendation=rep['recommendation'], privacy_note=rep['privacyNote'], model=model, source=source,
            latency_ms=ms))
        db.log(c, 'ai-auditor', 'audit_done', f'report {rid}: score {rep["score"]} {rep["verdict"]} via {source}')


def _worker(rid: int, ev: dict) -> None:
    try:
        rep, source, model, ms = run_ai_audit(ev, rid)
    except Exception:
        rep, source, model, ms = simulated_audit(ev), 'simulated', 'simulated-auditor', 0
    _finish(rid, rep, source, model, ms)


def _full(r) -> dict:
    d = {k: r[k] for k in ('id', 'transaction_ref', 'vendor_id', 'amount', 'device', 'kind', 'status', 'score', 'verdict',
                           'headline', 'summary', 'reasoning', 'recommendation', 'data_used', 'model', 'source',
                           'latency_ms', 'fee', 'fee_tier')}
    d['vendorIssues'], d['securityIssues'], d['privacyNote'] = r['vendor_issues'], r['security_issues'], r['privacy_note']
    d['verdictLabel'] = VERDICT_LABEL.get(r['verdict'] or '', 'Auditing…')
    d['createdAt'] = _aware(r['created_at']).isoformat()
    d['simulation'] = True
    return d


def _customer_view(r, detail: bool) -> dict:
    """What the customer's phone may see: score + key points; vendor internals stay private."""
    points = []
    if r['status'] == 'done':
        points = [s['title'] + ': ' + s['detail'] for s in (r['reasoning'] or []) if s.get('impact') == 'raises'][:3 if not detail else 5]
        if not points:
            points = [r['recommendation'] or '']
    return {'id': r['id'], 'status': r['status'], 'score': r['score'], 'verdict': r['verdict'],
            'verdictLabel': VERDICT_LABEL.get(r['verdict'] or '', 'Auditing…'), 'headline': r['headline'],
            'keyPoints': points, 'recommendation': r['recommendation'] if detail else None,
            'securityTips': (r['security_issues'] or [])[:2] if detail else [],
            'source': r['source'], 'model': r['model'], 'createdAt': _aware(r['created_at']).isoformat(),
            'privacy': 'Vendor details are kept private by the bank. Full reasoning stays on the bank auditor portal.',
            'simulation': True}


async def _body(request: Request) -> dict:
    try:
        b = await request.json()
    except Exception:
        raise HTTPException(422, 'Invalid JSON')
    if not isinstance(b, dict):
        raise HTTPException(422, 'Body must be a JSON object')
    return b


@router.get('/vendors')
def list_vendors():
    with db.get_engine().begin() as c:
        rows = c.execute(select(db.vendors)).mappings().all()
        return {'vendors': [_vendor_public(c, v) for v in rows], 'largeAmount': LARGE_AMOUNT,
                'database': db.backend_name(), 'simulation': True}


@router.get('/vendors/{vid}')
def vendor(vid: str, amount: float = 0):
    with db.get_engine().begin() as c:
        v = c.execute(select(db.vendors).where(db.vendors.c.id == vid)).mappings().first()
        if not v:
            raise HTTPException(404, 'Unknown vendor')
        out = _vendor_public(c, v)
        out['myHistory'] = _my_history(c, vid)
        out['feeQuote'] = _fee(c, vid, fix=False)
        out['qrText'] = qr_payload(v, amount)
        out['simulation'] = True
        return out


@router.post('/audit')
async def audit(request: Request):
    b = await _body(request)
    vid, device = b.get('vendorId'), str(b.get('device') or 'Phone')[:40]
    try:
        amount = float(b.get('amount'))
    except Exception:
        raise HTTPException(422, 'amount must be a number')
    if not isinstance(vid, str) or not (0 < amount <= 10_000_000):
        raise HTTPException(422, 'vendorId and a positive amount are required')
    with db.get_engine().begin() as c:
        v = c.execute(select(db.vendors).where(db.vendors.c.id == vid)).mappings().first()
        if not v:
            raise HTTPException(404, 'Unknown vendor')
        acct = c.execute(select(db.accounts).where(db.accounts.c.id == db.DEMO_ACCOUNT)).mappings().first()
        base = {'vendor': {'id': v['id'], 'name': v['name'], 'brandColor': v['brand_color'], 'verified': v['verified']},
                'amount': amount, 'largeAmount': LARGE_AMOUNT, 'simulation': True}
        if not acct['ai_audit_enabled']:
            db.log(c, device, 'audit_skipped_optout', f'{vid} ₹{amount}')
            return {**base, 'mode': 'off', 'warning': OPTOUT_WARNING, 'report': None, 'fee': None}
        large = amount >= LARGE_AMOUNT
        if not large:
            last = _latest(c, vid)
            if last:
                db.log(c, device, 'audit_summary_reused', f'{vid} ₹{amount} → report {last["id"]}')
                return {**base, 'mode': 'summary', 'report': _customer_view(last, False),
                        'fee': {'tier': 'included', 'fee': 0.0, 'simulated': True,
                                'note': 'Small payment: the earlier bank audit is reused at no extra fee'}}
        fee = _fee(c, vid, fix=True)
        ev = _evidence(c, v, amount, device)
        ref = str(b.get('transactionRef') or f'qr_{int(datetime.now().timestamp() * 1000)}')[:60]
        rid = c.execute(insert(db.audit_reports).values(
            transaction_ref=ref, account_id=db.DEMO_ACCOUNT, vendor_id=vid, amount=amount, device=device,
            kind='full' if large else 'quick', status='running', data_used=_data_used_view(ev), fee=fee['fee'],
            fee_tier=fee['tier'], created_at=db.NOW())).inserted_primary_key[0]
        db.log(c, device, 'audit_started', f'report {rid}: {vid} ₹{amount} ({"full AI" if large else "quick"}) fee ₹{fee["fee"]}')
    if large:
        threading.Thread(target=_worker, args=(rid, ev), daemon=True).start()
    else:
        _finish(rid, simulated_audit(ev), 'simulated', 'quick-check (no earlier audit on file)', 0)
    with db.get_engine().begin() as c:
        r = c.execute(select(db.audit_reports).where(db.audit_reports.c.id == rid)).mappings().first()
        return {**base, 'mode': 'full' if large else 'quick', 'report': _customer_view(r, large), 'fee': fee}


def _customer_profile(c, account_id: str) -> dict | None:
    """Bank-internal customer view for the auditor portal (simulated demo customer; never sent to the AI or the phone)."""
    a = c.execute(select(db.accounts).where(db.accounts.c.id == account_id)).mappings().first()
    if not a:
        return None
    cu = c.execute(select(db.customers).where(db.customers.c.id == a['customer_id'])).mappings().first()
    tx = c.execute(select(func.count(), func.coalesce(func.sum(db.transactions.c.amount), 0), func.count(func.distinct(db.transactions.c.vendor_id)))
                   .where(db.transactions.c.account_id == account_id)).first()
    n_aud = c.execute(select(func.count()).select_from(db.audit_reports).where(db.audit_reports.c.account_id == account_id)).scalar() or 0
    since = _aware(cu['created_at']) if cu else None
    return {'customerId': cu['id'] if cu else None, 'name': cu['name'] if cu else 'Unknown', 'kycLevel': cu['kyc_level'] if cu else None,
            'customerSince': since.date().isoformat() if since else None, 'accountId': account_id, 'account': a['masked_no'],
            'balanceDemo': a['balance_demo'], 'aiAuditEnabled': a['ai_audit_enabled'],
            'transactions': int(tx[0]), 'volume': round(float(tx[1]), 2), 'merchants': int(tx[2]), 'audits': int(n_aud)}


@router.get('/audits')
def audits(after: int = 0, limit: int = 30):
    with db.get_engine().begin() as c:
        q = select(db.audit_reports).order_by(db.audit_reports.c.id.desc()).limit(max(1, min(limit, 100)))
        rows = c.execute(q).mappings().all()
        names = {v['id']: v for v in c.execute(select(db.vendors)).mappings().all()}
        custs: dict[str, dict] = {}
        out = []
        for r in rows:
            d = _full(r)
            if r['account_id'] not in custs:
                custs[r['account_id']] = _customer_profile(c, r['account_id'])
            d['customer'] = custs[r['account_id']]
            vv = names.get(r['vendor_id'])
            d['vendor'] = {'id': vv['id'], 'name': vv['name'], 'brandColor': vv['brand_color'], 'city': vv['city']} if vv else None
            out.append(d)
        return {'audits': out, 'database': db.backend_name(), 'simulation': True}


@router.get('/audits/{rid}')
def audit_one(rid: int, view: str = 'customer'):
    with db.get_engine().begin() as c:
        r = c.execute(select(db.audit_reports).where(db.audit_reports.c.id == rid)).mappings().first()
        if not r:
            raise HTTPException(404, 'Unknown report')
        return _full(r) if view == 'auditor' else _customer_view(r, r['kind'] == 'full')


@router.get('/audits/{rid}/live')
def audit_live(rid: int):
    """Bank-internal: the prompt sent to the model, the text streamed so far and the raw output (in memory only)."""
    lv = LIVE.get(rid)
    if not lv:
        return {'available': False, 'simulation': True}
    import time as _t
    return {'available': True, 'elapsedMs': int((_t.time() - lv['startedAt']) * 1000), 'simulation': True,
            **{k: v for k, v in lv.items() if k != 'startedAt'}}


@router.get('/settings')
def get_settings():
    with db.get_engine().begin() as c:
        a = c.execute(select(db.accounts).where(db.accounts.c.id == db.DEMO_ACCOUNT)).mappings().first()
        return {'aiAuditEnabled': a['ai_audit_enabled'], 'optOutAcknowledgedAt': _aware(a['audit_optout_ack_at']).isoformat()
                if a['audit_optout_ack_at'] else None, 'warning': OPTOUT_WARNING, 'feeTiers': [
                    {'tier': t, 'fee': f, 'minPayments': m} for (m, t, f) in FEE_TIERS], 'largeAmount': LARGE_AMOUNT,
                'simulation': True}


@router.post('/settings')
async def set_settings(request: Request):
    b = await _body(request)
    on = b.get('aiAuditEnabled')
    if not isinstance(on, bool):
        raise HTTPException(422, 'aiAuditEnabled must be true or false')
    if not on and b.get('acknowledged') is not True:
        raise HTTPException(409, OPTOUT_WARNING)
    with db.get_engine().begin() as c:
        c.execute(update(db.accounts).where(db.accounts.c.id == db.DEMO_ACCOUNT).values(
            ai_audit_enabled=on, audit_optout_ack_at=None if on else db.NOW()))
        db.log(c, str(b.get('device') or 'customer')[:40], 'audit_enabled' if on else 'audit_disabled_ack',
               'AI audit turned on' if on else 'Customer acknowledged the bank warning and turned the AI audit off')
    return get_settings()


@router.get('/db')
def db_info():
    with db.get_engine().begin() as c:
        counts = {t.name: c.execute(select(func.count()).select_from(t)).scalar()
                  for t in (db.customers, db.accounts, db.vendors, db.transactions, db.disputes, db.audit_reports,
                            db.audit_fees, db.audit_log)}
        logs = c.execute(select(db.audit_log).order_by(db.audit_log.c.id.desc()).limit(12)).mappings().all()
        return {'database': db.backend_name(), 'tables': counts,
                'log': [{'at': _aware(l['at']).isoformat(), 'actor': l['actor'], 'action': l['action'], 'detail': l['detail']}
                        for l in logs], 'simulation': True}


__all__ = ['router', 'qr_payload', 'verdict_for']
