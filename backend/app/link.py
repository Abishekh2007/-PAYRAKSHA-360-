"""Phone <-> console link for RakshaPay DEMO.

SIMULATION ONLY: a link event records a demo risk check made on a phone. Nothing here initiates, authorizes or
forwards a payment, and nothing makes an outbound network call. The store is in memory and never persisted.

Both FastAPI apps (the console `app` and RakshaPay `pay_app` in app.main) include this one router, so they share
this module-level store: an event posted to the pay port is visible on the console port.

Contract (every JSON response carries "simulation": true):
  POST /api/link/scan      {device, source, input, replaces?}   -> {event, report, ml}
  POST /api/link/decision  {id, decision}                       -> {event}
  GET  /api/link/events?after=<seq>                             -> {events, latestSeq, devices, target}
  POST /api/link/heartbeat {device}                             -> {ok: true, target}
  POST /api/link/target    {qrText, label?}                     -> {target}
  GET  /api/link/info                                           -> {consoleUrl, payUrl, phoneUrl, lan}
  POST /api/link/reset                                          -> {ok: true}
"""
from __future__ import annotations

import os
import threading
import time
from collections import deque
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Query, Request

from app.config import load_config
from app.engine import analyze
from app.ml import ml_insight

router = APIRouter(prefix='/api/link')

# ---------------------------------------------------------------- module-level shared store

_lock = threading.Lock()
_events: deque[dict] = deque(maxlen=50)   # one dict per id; moved to end on every change
_seq: int = 0
_devices: dict[str, float] = {}           # name -> last_seen epoch (float)
_target: dict | None = None

_VALID_SOURCES = {'camera', 'gallery', 'console-target', 'sample', 'manual'}
_VALID_DECISIONS = {'cancelled', 'verify', 'trusted', 'paid_demo'}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _now_epoch() -> float:
    return time.time()


def reset_store() -> None:
    """Clear events, devices, target and the sequence counter (tests call this)."""
    global _seq, _target
    with _lock:
        _events.clear()
        _seq = 0
        _devices.clear()
        _target = None


# ---------------------------------------------------------------- helpers

def _next_seq() -> int:
    global _seq
    _seq += 1
    return _seq


def _mark_device(name: str) -> None:
    _devices[name] = _now_epoch()


def _event_by_id(event_id: str) -> dict | None:
    for ev in _events:
        if ev['id'] == event_id:
            return ev
    return None


def _move_to_end(event_id: str) -> None:
    """Remove the event with this id and re-append it at the end of the deque."""
    ev = None
    new_items = []
    for item in list(_events):
        if item['id'] == event_id:
            ev = item
        else:
            new_items.append(item)
    _events.clear()
    for item in new_items:
        _events.append(item)
    if ev is not None:
        _events.append(ev)


def _validate_device(raw_device: Any) -> str:
    if not isinstance(raw_device, str):
        raise HTTPException(status_code=422, detail='device must be a string')
    device = raw_device.strip()
    if not (1 <= len(device) <= 40):
        raise HTTPException(status_code=422, detail='device must be 1-40 characters')
    return device


def _validate_input(inp: Any) -> dict:
    """Validate and clean an input dict; returns only the keys the engine needs."""
    if not isinstance(inp, dict):
        raise HTTPException(status_code=422, detail='input must be an object')

    message = inp.get('message')
    url = inp.get('url')
    qr_text = inp.get('qrText')
    payment = inp.get('payment')
    behaviour = inp.get('behaviour')

    if message is not None and not isinstance(message, str):
        raise HTTPException(status_code=422, detail='input.message must be a string')
    if url is not None and not isinstance(url, str):
        raise HTTPException(status_code=422, detail='input.url must be a string')
    if qr_text is not None and not isinstance(qr_text, str):
        raise HTTPException(status_code=422, detail='input.qrText must be a string')
    if payment is not None and not isinstance(payment, dict):
        raise HTTPException(status_code=422, detail='input.payment must be an object')
    if behaviour is not None and not isinstance(behaviour, dict):
        raise HTTPException(status_code=422, detail='input.behaviour must be an object')

    # Size limits
    if message and len(message) > 5000:
        raise HTTPException(status_code=413, detail='Input too large for analysis.')
    if url and len(url) > 2048:
        raise HTTPException(status_code=413, detail='Input too large for analysis.')
    if qr_text and len(qr_text) > 4096:
        raise HTTPException(status_code=413, detail='Input too large for analysis.')

    # Need at least one non-blank text field OR a payment dict
    has_text = bool((message and message.strip()) or
                    (url and url.strip()) or
                    (qr_text and qr_text.strip()))
    has_payment = isinstance(payment, dict) and len(payment) > 0
    if not has_text and not has_payment:
        raise HTTPException(status_code=422, detail='input must contain at least one of message, url, qrText, or payment')

    clean: dict[str, Any] = {}
    if message is not None:
        clean['message'] = message
    if url is not None:
        clean['url'] = url
    if qr_text is not None:
        clean['qrText'] = qr_text
    if payment is not None:
        clean['payment'] = payment
    if behaviour is not None:
        clean['behaviour'] = behaviour
    return clean


# ---------------------------------------------------------------- endpoints

@router.post('/scan')
async def link_scan(request: Request):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=422, detail='Invalid JSON')
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail='Body must be a JSON object')

    raw_device = body.get('device')
    raw_source = body.get('source')
    raw_input = body.get('input')
    replaces = body.get('replaces')

    device = _validate_device(raw_device)

    if not isinstance(raw_source, str) or raw_source not in _VALID_SOURCES:
        raise HTTPException(status_code=422, detail=f'source must be one of {sorted(_VALID_SOURCES)}')

    if raw_input is None:
        raise HTTPException(status_code=422, detail='input is required')
    clean_input = _validate_input(raw_input)

    # Validate replaces before analysis (fast-fail)
    if replaces is not None:
        with _lock:
            old_ev = _event_by_id(replaces)
        if old_ev is None:
            raise HTTPException(status_code=404, detail=f'Event {replaces!r} not found')

    cfg = load_config()
    try:
        report = analyze(clean_input, cfg, 'python')
    except Exception:
        raise HTTPException(status_code=500, detail='Analysis failed.')

    msg_str = clean_input.get('message', '') or ''
    ml = ml_insight(msg_str)

    with _lock:
        # Re-validate replaces under lock
        if replaces is not None:
            old_ev2 = _event_by_id(replaces)
            if old_ev2 is None:
                raise HTTPException(status_code=404, detail=f'Event {replaces!r} not found')
            event_id = replaces
            # Remove from deque so we can update and re-append
            _move_to_end(event_id)
            _events.pop()
        else:
            event_id = 'lk_' + uuid4().hex[:8]

        seq = _next_seq()
        pay = report.get('payment', {}) or {}
        expl = report.get('explanation', {}) or {}

        event: dict[str, Any] = {
            'id': event_id,
            'seq': seq,
            'at': _now_iso(),
            'device': device,
            'source': raw_source,
            'input': clean_input,
            'score': report.get('score', 0),
            'level': report.get('level', 'LOW'),
            'levelLabel': report.get('levelLabel', 'LOW RISK'),
            'patternName': report.get('patternName', ''),
            'recipient': pay.get('recipient'),
            'amount': pay.get('amount'),
            'headline': expl.get('headline', ''),
            'decision': 'pending',
            'decidedAt': None,
            'simulation': True,
        }

        _events.append(event)
        _mark_device(device)

    return {'event': event, 'report': report, 'ml': ml, 'simulation': True}


@router.post('/decision')
async def link_decision(request: Request):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=422, detail='Invalid JSON')
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail='Body must be a JSON object')

    event_id = body.get('id')
    decision = body.get('decision')

    if not isinstance(event_id, str):
        raise HTTPException(status_code=422, detail='id must be a string')
    if decision not in _VALID_DECISIONS:
        raise HTTPException(status_code=422, detail=f'decision must be one of {sorted(_VALID_DECISIONS)}')

    with _lock:
        ev = _event_by_id(event_id)
        if ev is None:
            raise HTTPException(status_code=404, detail=f'Event {event_id!r} not found')

        ev['decision'] = decision
        ev['decidedAt'] = _now_iso()
        ev['seq'] = _next_seq()
        ev['at'] = ev['decidedAt']
        _move_to_end(event_id)

    return {'event': ev, 'simulation': True}


@router.get('/events')
def link_events(after: int = Query(0, ge=0)):
    with _lock:
        all_events = list(_events)
        seq_now = _seq
        target_copy = dict(_target) if _target else None
        devices_copy = dict(_devices)

    now = _now_epoch()
    filtered = [e for e in all_events if e['seq'] > after]
    filtered.sort(key=lambda e: e['seq'])
    filtered = filtered[:50]

    devices_list = []
    for name, last_seen_epoch in sorted(devices_copy.items(), key=lambda kv: -kv[1]):
        devices_list.append({
            'name': name,
            'lastSeen': datetime.fromtimestamp(last_seen_epoch, tz=timezone.utc).isoformat(),
            'online': (now - last_seen_epoch) < 10,
        })

    return {
        'events': filtered,
        'latestSeq': seq_now,
        'devices': devices_list,
        'target': target_copy,
        'simulation': True,
    }


@router.post('/heartbeat')
async def link_heartbeat(request: Request):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=422, detail='Invalid JSON')
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail='Body must be a JSON object')

    raw_device = body.get('device')
    device = _validate_device(raw_device)

    with _lock:
        _mark_device(device)
        target_copy = dict(_target) if _target else None

    return {'ok': True, 'target': target_copy, 'simulation': True}


@router.post('/target')
async def link_target(request: Request):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=422, detail='Invalid JSON')
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail='Body must be a JSON object')

    global _target
    qr_text = body.get('qrText')
    label = body.get('label', 'Demo QR')

    if qr_text is None:
        # Clear target
        with _lock:
            _target = None
        return {'target': None, 'simulation': True}

    if not isinstance(qr_text, str):
        raise HTTPException(status_code=422, detail='qrText must be a string')
    qr_text = qr_text.strip()
    if not (1 <= len(qr_text) <= 4096):
        raise HTTPException(status_code=422, detail='qrText must be 1-4096 characters')
    if qr_text.lower().startswith('upi:'):
        raise HTTPException(status_code=422, detail='qrText must not be a UPI deep-link')

    if label is None:
        label = 'Demo QR'
    if not isinstance(label, str):
        raise HTTPException(status_code=422, detail='label must be a string')
    if len(label) > 80:
        raise HTTPException(status_code=422, detail='label must be 80 characters or fewer')

    target_obj = {'qrText': qr_text, 'label': label, 'setAt': _now_iso()}
    with _lock:
        _target = target_obj

    return {'target': target_obj, 'simulation': True}


@router.get('/info')
def link_info():
    return {
        'consoleUrl': os.environ.get('PAYRAKSHA_CONSOLE_URL') or None,
        'payUrl': os.environ.get('PAYRAKSHA_PAY_URL') or None,
        'phoneUrl': os.environ.get('PAYRAKSHA_PHONE_URL') or None,
        'lan': os.environ.get('PAYRAKSHA_LAN') == '1',
        'simulation': True,
    }


@router.post('/reset')
def link_reset():
    reset_store()
    return {'ok': True, 'simulation': True}
