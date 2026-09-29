"""Optional ML second opinion: TF-IDF + logistic regression trained at start-up on a small synthetic corpus.

STUB: the backend-api task implements it. It never changes the explainable risk score.
"""
from __future__ import annotations


def ml_status() -> dict:
    return {'available': False, 'model': None}


def ml_insight(text: str) -> dict | None:
    return None
