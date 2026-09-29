"""PAYRAKSHA 360 API. STUB: the backend-api task implements the endpoints.

SIMULATION ONLY: this service never initiates, authorizes or forwards a payment and makes no outbound network calls.
"""
from fastapi import FastAPI

app = FastAPI(title='PAYRAKSHA 360 API (simulation)', version='1.0.0')


@app.get('/api/health')
def health() -> dict:
    return {'status': 'ok', 'simulation': True}
