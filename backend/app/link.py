"""Phone <-> console link for RakshaPay DEMO. STUB: the link-api task implements it (the contract below is final).

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
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix='/api/link')


def _todo():
    raise HTTPException(status_code=501, detail='Not implemented yet.')


@router.post('/scan')
def link_scan():
    _todo()


@router.post('/decision')
def link_decision():
    _todo()


@router.get('/events')
def link_events():
    _todo()


@router.post('/heartbeat')
def link_heartbeat():
    _todo()


@router.post('/target')
def link_target():
    _todo()


@router.get('/info')
def link_info():
    _todo()


@router.post('/reset')
def link_reset():
    _todo()


def reset_store() -> None:
    """Clear events, devices, target and the sequence counter (tests call this)."""
