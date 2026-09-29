"""Loads the shared engine configuration: the same JSON files the browser engine uses."""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path


def find_shared() -> Path:
    """Walks up from this file to the repository's shared/ folder (works inside git worktrees too)."""
    here = Path(__file__).resolve()
    for parent in here.parents:
        candidate = parent / 'shared'
        if (candidate / 'engine-config.json').is_file():
            return candidate
    raise FileNotFoundError(f'shared/engine-config.json not found above {here}')


def _read(name: str):
    with open(find_shared() / name, encoding='utf-8') as f:
        return json.load(f)


@lru_cache(maxsize=1)
def load_config() -> dict:
    """The engine config dict. Shared and cached: callers must never mutate it."""
    return {
        'engine': _read('engine-config.json'),
        'lexicon': _read('lexicon.json'),
        'urlRules': _read('url-rules.json'),
        'recipients': _read('recipients.json'),
        'patterns': _read('patterns.json'),
    }


@lru_cache(maxsize=1)
def load_scenarios() -> dict:
    return _read('scenarios.json')
