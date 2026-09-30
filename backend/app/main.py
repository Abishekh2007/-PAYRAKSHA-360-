"""PAYRAKSHA 360 API: one router served by two apps (the console `app` and RakshaPay `pay_app`).

SIMULATION ONLY: this service never initiates, authorizes or forwards a payment and makes no outbound network calls, except the vendor AI audit to the operator's own model server (OMNIROUTE_BASE_URL).
"""
import os
from pathlib import Path
from fastapi import APIRouter, FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import load_config, load_scenarios
from app.engine import ENGINE_VERSION, analyze, analyze_url, parse_qr
from app.ml import ml_status, ml_insight
from app.link import router as link_router
from app.bank.router import router as bank_router

api = APIRouter()

CORS_ORIGINS = [
    f'http://{host}:{port}'
    for host in ('localhost', '127.0.0.1')
    for port in (5173, 4173, 5174, 4174, 5175, 4175)
]

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        cl = request.headers.get("content-length")
        if cl is not None and int(cl) > 65536:
            return JSONResponse({"detail": "Input too large for analysis."}, status_code=413, headers={
                "X-Content-Type-Options": "nosniff",
                "Referrer-Policy": "no-referrer",
                "X-Simulation": "true"
            })

        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["X-Simulation"] = "true"
        return response



@api.get('/api/health')
def health():
    cfg = load_config()
    return {
        'status': 'ok',
        'simulation': True,
        'engine': {
            'name': cfg['engine']['engineName'],
            'version': ENGINE_VERSION,
            'runtime': 'python'
        },
        'ml': ml_status()
    }


@api.post('/api/analyze')
async def analyze_endpoint(request: Request):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid JSON")
    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="Body must be a JSON object")

    message = body.get('message')
    url = body.get('url')
    qr_text = body.get('qrText')

    if message is not None and not isinstance(message, str):
        raise HTTPException(status_code=422, detail="message must be a string")
    if url is not None and not isinstance(url, str):
        raise HTTPException(status_code=422, detail="url must be a string")
    if qr_text is not None and not isinstance(qr_text, str):
        raise HTTPException(status_code=422, detail="qrText must be a string")

    if (message and len(message) > 5000) or \
       (url and len(url) > 2048) or \
       (qr_text and len(qr_text) > 4096):
        raise HTTPException(status_code=413, detail="Input too large for analysis.")

    cfg = load_config()
    try:
        res = analyze(body, cfg, 'python')
    except Exception as e:
        raise HTTPException(status_code=500, detail="Analysis failed.")

    msg_str = message if isinstance(message, str) else ''
    res['ml'] = ml_insight(msg_str)

    return res


@api.post('/api/analyze/url')
async def analyze_url_endpoint(request: Request):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid JSON")
    if not isinstance(body, dict) or 'url' not in body or not isinstance(body['url'], str):
        raise HTTPException(status_code=422, detail="url must be a string")

    url = body['url']
    if len(url) > 2048:
        raise HTTPException(status_code=413, detail="Input too large for analysis.")

    cfg = load_config()
    try:
        return analyze_url(url, cfg)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Analysis failed.")


@api.post('/api/qr/parse')
async def parse_qr_endpoint(request: Request):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid JSON")
    if not isinstance(body, dict) or 'text' not in body or not isinstance(body['text'], str):
        raise HTTPException(status_code=422, detail="text must be a string")

    text = body['text']
    if len(text) > 4096:
        raise HTTPException(status_code=413, detail="Input too large for analysis.")

    cfg = load_config()
    try:
        return parse_qr(text, cfg)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Analysis failed.")


@api.get('/api/scenarios')
def scenarios_endpoint():
    return load_scenarios()


api.include_router(link_router)
api.include_router(bank_router)

# Static app routing
repodir = Path(__file__).resolve().parent.parent.parent


def create_app(dist_dir: Path, title: str = 'PAYRAKSHA 360 API (simulation)') -> FastAPI:
    """Build one app: the shared API router, then the SPA in dist_dir (when built) at /."""
    application = FastAPI(title=title, version='1.0.0')
    application.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_methods=['GET', 'POST'],
        allow_headers=['*'],
        allow_credentials=False,
    )
    application.add_middleware(SecurityHeadersMiddleware)
    application.include_router(api)
    if (dist_dir / 'index.html').is_file():
        application.mount('/', StaticFiles(directory=str(dist_dir), html=True), name='static')
    else:
        @application.get('/')
        def root():
            return {'app': title, 'docs': '/docs'}
    return application


distdir = Path(os.environ['PAYRAKSHA_DIST_DIR']) if os.environ.get('PAYRAKSHA_DIST_DIR') else repodir / 'dist'
auditdistdir = Path(os.environ['PAYRAKSHA_AUDIT_DIST_DIR']) if os.environ.get('PAYRAKSHA_AUDIT_DIST_DIR') else repodir / 'dist-auditor'
paydistdir = Path(os.environ['PAYRAKSHA_PAY_DIST_DIR']) if os.environ.get('PAYRAKSHA_PAY_DIST_DIR') else repodir / 'dist-pay'

# The console (dashboard) and RakshaPay (phone app) share one process, one API and one link store.
app = create_app(distdir)
pay_app = create_app(paydistdir, 'RakshaPay DEMO API (simulation)')

# The AI Auditor portal (bank-internal, server side) is a third app on its own port, same API and database.
audit_app = create_app(auditdistdir, 'PAYRAKSHA AI Auditor (simulation)')
