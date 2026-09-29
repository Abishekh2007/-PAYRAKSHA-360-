"""PAYRAKSHA 360 risk engine: a faithful Python port of shared/reference/engine.mjs.

Pure functions: no I/O, no clock, no randomness, no network. Standard library only.
All weights, thresholds and word lists are read from cfg (shared/*.json). Nothing hard-coded.
SIMULATION ONLY — this engine analyses demo data. It never initiates a payment.
"""
from __future__ import annotations

import copy
import math
import re
from typing import Any

ENGINE_VERSION = '1.0.0'

CUE_GROUPS = ['urgency', 'threat', 'authority', 'paymentRequest', 'lure', 'secrecy', 'credential']
FACTOR_KEYS = ['recipientNovelty', 'urgency', 'impersonation', 'amountAnomaly', 'suspiciousURL',
               'qrRedirection', 'socialEngineering', 'contextMismatch', 'behaviouralAnomaly', 'untrustedSource']
DNA_KEYS = ['urgency', 'impersonation', 'recipientNovelty', 'amountAnomaly', 'suspiciousURL',
            'qrRedirection', 'socialEngineering', 'contextMismatch', 'behaviouralAnomaly']
DNA_LABELS = {
    'urgency': 'Urgency',
    'impersonation': 'Impersonation',
    'recipientNovelty': 'Unknown Recipient',
    'amountAnomaly': 'Amount Anomaly',
    'suspiciousURL': 'Suspicious URL',
    'qrRedirection': 'QR Redirection',
    'socialEngineering': 'Social Engineering',
    'contextMismatch': 'Context Mismatch',
    'behaviouralAnomaly': 'Behavioural Anomaly',
}
DISCLAIMER = 'PAYRAKSHA does not treat any single signal as proof of fraud. Multiple contextual signals are evaluated together.'
SIMULATION_NOTICE = 'SIMULATION / DEMO — no real payment was initiated.'

# ---------------------------------------------------------------- numeric + string helpers

def _r2(v):
    return math.floor(v * 100 + 0.5) / 100

def _r1(v):
    return math.floor(v * 10 + 0.5) / 10

def _clamp(v, lo, hi):
    return max(lo, min(hi, v))

def _points_for(weight, value):
    return math.floor(weight * value + 0.5)

def _pct(v):
    return math.floor(v * 100 + 0.5)

def _fmt_num(v):
    # Shortest decimal form: 3 -> "3", 2.7 -> "2.7"
    # Python: str(int(v)) if v == int(v) else repr(v)
    return str(int(v)) if v == int(v) else repr(v)

def fmt_inr(n: float) -> str:
    """Indian digit grouping with rupee sign: 1999 -> '₹1,999', 1500000 -> '₹15,00,000', 10.5 -> '₹10.50'"""
    neg = n < 0
    abs_n = abs(n)
    whole = math.floor(abs_n)
    cents = math.floor((abs_n - whole) * 100 + 0.5)
    s = str(whole)
    if len(s) > 3:
        last3 = s[-3:]
        rest = s[:-3]
        parts = []
        while len(rest) > 2:
            parts.insert(0, rest[-2:])
            rest = rest[:-2]
        if len(rest) > 0:
            parts.insert(0, rest)
        s = ','.join(parts) + ',' + last3
    if cents > 0:
        s += '.' + str(cents).zfill(2)
    return ('-' if neg else '') + '₹' + s

def _join_list(items):
    if len(items) == 0:
        return ''
    if len(items) == 1:
        return items[0]
    if len(items) == 2:
        return items[0] + ' and ' + items[1]
    return ', '.join(items[:-1]) + ', and ' + items[-1]

def _capitalize(s):
    return s[0].upper() + s[1:] if s else s

def _severity_of(v, thresholds):
    if v >= thresholds['severityHigh']:
        return 'high'
    if v >= thresholds['severityMedium']:
        return 'medium'
    if v > 0:
        return 'low'
    return 'none'

def fnv1a(s: str) -> int:
    """FNV-1a 32-bit over Unicode code points."""
    h = 0x811c9dc5
    for ch in s:
        h ^= ord(ch)
        h = (h * 0x01000193) & 0xFFFFFFFF
    return h

def _report_id(input_dict, score):
    key = (input_dict.get('message') or '') + '|' + (input_dict.get('url') or '') + '|' + (input_dict.get('qrText') or '') + '|' + str(score)
    return 'PR-' + format(fnv1a(key), '08X')

# ---------------------------------------------------------------- cue matching

def _normalize_text(s):
    """Normalize text for cue matching."""
    t = (s if s is not None else '').lower()
    # Replace curly apostrophes with straight ones
    t = t.replace('‘', "'").replace('’', "'")
    return t

_ALNUM = set('abcdefghijklmnopqrstuvwxyz0123456789')

def _is_alnum(ch):
    return ch != '' and ch in _ALNUM

def _match_cues(t, cues):
    """Returns distinct cues (in list order) found in already-normalized text."""
    found = []
    for cue in cues:
        if cue in found:
            continue
        from_ = 0
        while True:
            i = t.find(cue, from_)
            if i < 0:
                break
            before = t[i - 1] if i > 0 else ''
            after = t[i + len(cue)] if i + len(cue) < len(t) else ''
            ok_start = not _is_alnum(cue[0]) or not _is_alnum(before)
            ok_end = not _is_alnum(cue[-1]) or not _is_alnum(after)
            if ok_start and ok_end:
                found.append(cue)
                break
            from_ = i + 1
    return found

# AMOUNT_RE: JS /(?:₹|\brs\.?|\binr)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i
# Using re.ASCII means \b is ASCII word boundary, which is correct here
_AMOUNT_RE = re.compile(r'(?:₹|\brs\.?|\binr)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)', re.IGNORECASE)
# URL_RE: JS /\bhttps?:\/\/[^\s<>"']+/gi
_URL_RE = re.compile(r'\bhttps?://[^\s<>"\']+', re.IGNORECASE)

def _extract_amount(text):
    m = _AMOUNT_RE.search(text if text is not None else '')
    if not m:
        return None
    v_str = m.group(1).replace(',', '')
    try:
        v = float(v_str)
    except ValueError:
        return None
    if math.isfinite(v):
        return _r2(v)
    return None

def _extract_urls(text):
    out = []
    for m in _URL_RE.finditer(text if text is not None else ''):
        u = m.group(0)
        # Strip trailing punctuation: /[.,;:!?)\]]+$/
        u = re.sub(r'[.,;:!?)\]]+$', '', u)
        if u not in out:
            out.append(u)
    return out

# ---------------------------------------------------------------- text analysis

_SIGNAL_DEFS = [
    {'id': 'urgency', 'label': 'Urgency', 'groups': ['urgency'], 'highAt': 2},
    {'id': 'threat', 'label': 'Threat language', 'groups': ['threat'], 'highAt': 1},
    {'id': 'authority', 'label': 'Authority impersonation', 'groups': ['authority'], 'highAt': 2},
    {'id': 'paymentRequest', 'label': 'Payment request', 'groups': ['paymentRequest'], 'highAt': 2},
    {'id': 'lure', 'label': 'Social engineering', 'groups': ['lure'], 'highAt': 2},
    {'id': 'suspiciousAction', 'label': 'Suspicious action request', 'groups': ['secrecy', 'credential'], 'highAt': 1},
]

def analyze_text(text: str, cfg: dict) -> dict[str, Any]:
    """Analyse text for risk signals."""
    raw = text if text is not None else ''
    t = _normalize_text(raw)
    cues = {}
    counts = {}
    for g in CUE_GROUPS:
        cues[g] = _match_cues(t, cfg['lexicon']['signals'][g])
        counts[g] = len(cues[g])
    category_scores = {}
    for cat in cfg['engine']['categoryPriority']:
        category_scores[cat] = len(_match_cues(t, cfg['lexicon']['categories'].get(cat) or []))
    category = 'unknown'
    best = 0
    for cat in cfg['engine']['categoryPriority']:
        if category_scores[cat] > best:
            best = category_scores[cat]
            category = cat
    signals = []
    for d in _SIGNAL_DEFS:
        lst = []
        for g in d['groups']:
            for c in cues[g]:
                lst.append(c)
        n = len(lst)
        signals.append({
            'id': d['id'],
            'label': d['label'],
            'cues': lst,
            'count': n,
            'severity': 'high' if n >= d['highAt'] else ('medium' if n >= 1 else 'none'),
        })
    return {
        'text': raw,
        'empty': t.strip() == '',
        'cues': cues,
        'counts': counts,
        'category': category,
        'categoryLabel': cfg['engine']['categories'][category]['label'],
        'categoryScores': category_scores,
        'amount': _extract_amount(raw),
        'urls': _extract_urls(raw),
        'signals': signals,
    }

# ---------------------------------------------------------------- URL analysis (simulated, offline)

_URL_ERROR = 'Enter a valid URL.'

def level_for(score, cfg) -> dict:
    """Return the level object for a score."""
    for l in cfg['engine']['levels']:
        if score >= l['min'] and score <= l['max']:
            return l
    return cfg['engine']['levels'][-1]

def _invalid_url(input_str):
    return {
        'input': input_str,
        'valid': False,
        'error': _URL_ERROR,
        'normalized': '',
        'scheme': '',
        'host': '',
        'path': '',
        'registeredDomain': '',
        'tld': '',
        'reputation': 'unknown',
        'reputationNote': '',
        'checks': [],
        'score': 0,
        'level': 'LOW',
        'levelLabel': 'LOW RISK',
    }

# JS: /^[a-z][a-z0-9+.-]*:\/\//i
_SCHEME_RE = re.compile(r'^[a-z][a-z0-9+.\-]*://', re.IGNORECASE)
# JS: /^(https?):\/\/([^/?#\s]+)([^?#\s]*)(\?[^#\s]*)?(#\S*)?$/i
_HTTP_RE = re.compile(r'^(https?)://([^/?#\s]+)([^?#\s]*)(\?[^#\s]*)?(#\S*)?$', re.IGNORECASE)
# JS: /^[a-z0-9.-]+$/
_HOST_CHARS_RE = re.compile(r'^[a-z0-9.\-]+$', re.IGNORECASE)
# JS: /^\d{1,3}(\.\d{1,3}){3}$/
_IP_RE = re.compile(r'^\d{1,3}(\.\d{1,3}){3}$')

def analyze_url(raw: str, cfg: dict) -> dict[str, Any]:
    """Analyse a URL for phishing / scam signals."""
    rules = cfg['urlRules']
    P = rules['points']
    input_str = (raw if raw is not None else '').strip()
    if input_str == '':
        return _invalid_url(input_str)
    s = input_str
    if not _SCHEME_RE.match(s):
        s = 'https://' + s
    m = _HTTP_RE.match(s)
    if not m:
        return _invalid_url(input_str)
    scheme = m.group(1).lower()
    authority = m.group(2).lower()
    has_at = '@' in authority
    if has_at:
        authority = authority[authority.rfind('@') + 1:]
    # Remove port
    host = re.sub(r':\d+$', '', authority)
    if not _HOST_CHARS_RE.match(host) or '.' not in host or host.startswith('.') or host.endswith('.') or '..' in host:
        return _invalid_url(input_str)
    path = m.group(3) if m.group(3) is not None else ''
    query = m.group(4) if m.group(4) is not None else ''
    labels = host.split('.')
    tld = labels[-1]
    is_ip = bool(_IP_RE.match(host))
    registered = host if is_ip else '.'.join(labels[-2:])
    official = host in rules['officialDomains'] or registered in rules['officialDomains']
    rep = rules['reputation'].get(host) or rules['reputation'].get(registered) or None
    checks = []

    def add(id_, label, points, detail):
        checks.append({'id': id_, 'label': label, 'points': points, 'detail': detail})

    if rep and rep['status'] == 'trusted':
        add('reputation', 'Trusted domain (demo allowlist)', P['trusted'], rep['note'])
    if rep and rep['status'] == 'reported':
        add('reputation', 'Reported in threat feed (simulated)', P['reported'], rep['note'])
    if rep and rep['status'] == 'new':
        add('reputation', 'Newly observed domain (simulated)', P['new'], rep['note'])
    if scheme == 'http':
        add('http', 'No HTTPS', P['http'], 'The link does not use an encrypted connection.')
    if is_ip:
        add('ipHost', 'IP address instead of a name', P['ipHost'], 'Genuine payment pages use a named domain.')
    if 'xn--' in host:
        add('punycode', 'Look-alike characters (punycode)', P['punycode'], 'The domain uses encoded characters that can imitate a real brand.')
    if has_at:
        add('atSign', "'@' hides the real destination", P['atSign'], "Everything before '@' is ignored by the browser.")
    if registered in rules['shorteners']:
        add('shortener', 'URL shortener', P['shortener'], 'A shortener hides where the link really goes.')
    if not is_ip and len(labels) - 2 >= 2:
        add('subdomains', 'Excessive subdomains', P['excessiveSubdomains'], 'The domain has ' + str(len(labels) - 2) + ' subdomain levels.')
    hyphens = host.count('-')
    if hyphens >= 2:
        add('hyphens', 'Many hyphens in domain', P['hyphens'], 'The domain contains ' + str(hyphens) + ' hyphens, common in look-alike domains.')
    host_no_tld = '.'.join(labels[:-1])
    if not official:
        brand = next((b for b in rules['brandTokens'] if b in host_no_tld), None)
        if brand is not None:
            add('brand', 'Brand name on an unofficial domain', P['brandLookalike'], "Uses '" + brand + "' but is not an official domain.")
    host_words = [k for k in rules['hostKeywords'] if k in host_no_tld]
    if len(host_words) > 0:
        n = min(len(host_words), P['hostKeywordMax'])
        add('hostKeywords', 'Bait words in domain', n * P['hostKeywordEach'], 'Domain contains: ' + ', '.join(host_words[:n]) + '.')
    tokens = [x for x in re.split(r'[^a-z0-9]+', (path + query).lower()) if x != '']
    path_words = [k for k in rules['pathKeywords'] if k in tokens]
    if len(path_words) > 0:
        n = min(len(path_words), P['pathKeywordMax'])
        add('pathKeywords', 'Sensitive words in path', n * P['pathKeywordEach'], 'Path contains: ' + ', '.join(path_words[:n]) + '.')
    if tld in rules['suspiciousTlds']:
        add('tld', 'High-risk top-level domain', P['suspiciousTld'], "'." + tld + "' is frequently abused.")
    if len(s) > 75:
        add('length', 'Very long URL', P['longUrl'], 'Long links can hide the real destination.')
    first_label = labels[0]
    # JS: (firstLabel.match(/[0-9]/g) ?? []).length
    digits = len(re.findall(r'[0-9]', first_label))
    if not is_ip and digits >= 3:
        add('digits', 'Many digits in domain', P['digitsInName'], 'The domain contains ' + str(digits) + ' digits.')

    total = sum(c['points'] for c in checks)
    score = _clamp(total, 0, 100)
    lvl = level_for(score, cfg)
    return {
        'input': input_str,
        'valid': True,
        'error': None,
        'normalized': s,
        'scheme': scheme,
        'host': host,
        'path': path,
        'registeredDomain': registered,
        'tld': tld,
        'reputation': rep['status'] if rep else 'unknown',
        'reputationNote': rep['note'] if rep else 'Not present in the simulated reputation database.',
        'checks': checks,
        'score': score,
        'level': lvl['id'],
        'levelLabel': lvl['label'],
    }

# ---------------------------------------------------------------- QR parsing (analysis only — never pays)

_QR_ERROR = 'Unable to read QR. Try again or upload a clearer image.'

def _normalize_source(v, cfg):
    s = (v if v is not None else '').lower().strip()
    if s == '':
        return 'unknown'
    id_ = re.sub(r'[\s\-]+', '_', s)
    if id_ in cfg['engine']['sourceTrust']:
        return id_
    if 'official' in s:
        return 'official_app'
    if 'whatsapp' in s:
        return 'whatsapp'
    if 'sms' in s or 'text message' in s:
        return 'sms'
    if 'merchant' in s or 'store' in s:
        return 'known_merchant'
    if 'call' in s or 'phone' in s:
        return 'phone_call'
    if 'mail' in s:
        return 'email'
    if 'social' in s or 'instagram' in s or 'facebook' in s or 'telegram' in s:
        return 'social_media'
    if 'web' in s or 'link' in s or 'browser' in s:
        return 'unknown_website'
    return 'unknown'

def _decode_value(v):
    """Decode a QR field value: replace + with space, then decodeURIComponent."""
    plus = v.replace('+', ' ')
    # Attempt decodeURIComponent equivalent: strict percent-decode
    try:
        return _decode_uri_component(plus)
    except Exception:
        return plus

def _decode_uri_component(s):
    """
    Strict decodeURIComponent: raises if any % is not followed by two hex digits
    or if resulting bytes are not valid UTF-8.
    """
    # Check for any % not followed by exactly two hex digits
    i = 0
    result_bytes = bytearray()
    while i < len(s):
        ch = s[i]
        if ch == '%':
            if i + 2 >= len(s):
                raise ValueError('Invalid percent encoding')
            h1 = s[i + 1]
            h2 = s[i + 2]
            if h1 not in '0123456789ABCDEFabcdef' or h2 not in '0123456789ABCDEFabcdef':
                raise ValueError('Invalid percent encoding')
            result_bytes.append(int(h1 + h2, 16))
            i += 3
        else:
            # Non-ASCII characters that are already unicode go through as-is
            result_bytes.extend(ch.encode('utf-8'))
            i += 1
    return result_bytes.decode('utf-8')

def _parse_amount_qr(v):
    """Parse amount from QR field value."""
    cleaned = re.sub(r'[₹,\s]', '', str(v))
    try:
        n = float(cleaned)
    except ValueError:
        return None
    if math.isfinite(n) and n >= 0:
        return _r2(n)
    return None

_TRUE_WORDS = ['true', 'yes', '1', 'high']

def parse_qr(raw: str, cfg: dict) -> dict[str, Any]:
    """Parse a QR code string (analysis only, never initiates a payment)."""
    raw_trimmed = (raw if raw is not None else '').strip()
    res = {
        'raw': raw_trimmed,
        'format': 'empty',
        'fields': {},
        'urgentFlag': False,
        'warnings': [],
        'isDemo': False,
        'error': None,
    }
    if raw_trimmed == '':
        res['error'] = _QR_ERROR
        return res
    lower = raw_trimmed.lower()
    if lower.startswith('payraksha://'):
        res['format'] = 'payraksha'
        res['isDemo'] = True
        body = raw_trimmed[len('payraksha://'):]
        # Find ? or \r or \n
        cut = -1
        for ci, ch in enumerate(body):
            if ch in '?\r\n':
                cut = ci
                break
        params = '' if cut < 0 else body[cut + 1:]
        for piece in re.split(r'[\r\n&?]+', params):
            p = piece.strip()
            eq = p.find('=')
            if eq <= 0:
                continue
            key = p[:eq].strip().lower()
            value = _decode_value(p[eq + 1:].strip())
            if key in ('recipient', 'pa'):
                res['fields']['recipient'] = value.lower()
            elif key in ('amount', 'am'):
                a = _parse_amount_qr(value)
                if a is not None:
                    res['fields']['amount'] = a
            elif key in ('merchant', 'pn', 'name'):
                res['fields']['merchant'] = value
            elif key in ('note', 'tn', 'message'):
                res['fields']['note'] = value
            elif key in ('source', 'src', 'channel'):
                res['fields']['source'] = _normalize_source(value, cfg)
                res['fields']['sourceLabel'] = value
            elif key == 'scenario':
                res['fields']['scenario'] = value
            elif key in ('urgency', 'urgent'):
                res['urgentFlag'] = value.lower() in _TRUE_WORDS
            elif key in ('recipientverified', 'verified'):
                if value.lower() in _TRUE_WORDS:
                    res['warnings'].append('The QR claims its recipient is verified. PAYRAKSHA ignores self-asserted verification.')
        res['warnings'].insert(0, 'Demo payment QR — simulation only. Scanning never sends money.')
    elif lower.startswith('upi://'):
        res['format'] = 'upi'
        q = raw_trimmed.find('?')
        params = '' if q < 0 else raw_trimmed[q + 1:]
        for piece in params.split('&'):
            eq = piece.find('=')
            if eq <= 0:
                continue
            key = piece[:eq].strip().lower()
            value = _decode_value(piece[eq + 1:].strip())
            if key == 'pa':
                res['fields']['recipient'] = value.lower()
            elif key == 'pn':
                res['fields']['merchant'] = value
            elif key == 'am':
                a = _parse_amount_qr(value)
                if a is not None:
                    res['fields']['amount'] = a
            elif key == 'tn':
                res['fields']['note'] = value
        res['warnings'].append('Real UPI payment QR detected. PAYRAKSHA only analyses it and never initiates a payment.')
    elif lower.startswith('http://') or lower.startswith('https://'):
        res['format'] = 'url'
        res['fields']['url'] = raw_trimmed
        res['warnings'].append('This QR opens a web link instead of a payment request.')
    else:
        res['format'] = 'text'
        res['fields']['note'] = raw_trimmed
    return res

# ---------------------------------------------------------------- payment context resolution

def _resolve_payment(input_dict, text, qr, url, cfg):
    p = input_dict.get('payment') or {}
    f = qr['fields'] if qr else {}
    recipient = p.get('recipient') if p.get('recipient') is not None else (f.get('recipient') if f.get('recipient') is not None else None)
    dir_ = cfg['recipients'].get(recipient) if recipient is not None else None
    amount_val = p.get('amount') if p.get('amount') is not None else (f.get('amount') if f.get('amount') is not None else (text['amount'] if text['amount'] is not None else None))
    merchant = p.get('merchant') if p.get('merchant') is not None else (f.get('merchant') if f.get('merchant') is not None else None)
    source = p.get('source') if p.get('source') is not None else (f.get('source') if f.get('source') is not None else 'unknown')
    category = text['category'] if text['category'] != 'unknown' else (dir_['category'] if dir_ else 'unknown')
    cat = cfg['engine']['categories'][category]
    via_qr = qr is not None and (qr['format'] == 'payraksha' or qr['format'] == 'upi')
    if p.get('hasPaymentRequest') is not None:
        has_payment_request = p['hasPaymentRequest']
    else:
        has_payment_request = text['counts']['paymentRequest'] > 0 or amount_val is not None or via_qr
    return {
        'recipient': recipient,
        'recipientName': dir_['name'] if dir_ else None,
        'inDirectory': dir_ is not None,
        'recipientChecked': p.get('recipientChecked') if p.get('recipientChecked') is not None else True,
        'recipientVerified': p.get('recipientVerified') if p.get('recipientVerified') is not None else (dir_['verified'] if dir_ else False),
        'previousPayments': p.get('previousPayments') if p.get('previousPayments') is not None else (dir_['previousPayments'] if dir_ else 0),
        'amount': None if amount_val is None else _r2(amount_val),
        'typicalAmount': p.get('typicalAmount') if p.get('typicalAmount') is not None else (dir_['typicalAmount'] if dir_ else cat['typicalAmount']),
        'amountUnusual': p.get('amountUnusual') if p.get('amountUnusual') is not None else None,
        'merchant': merchant,
        'source': source,
        'sourceLabel': cfg['engine']['sourceLabels'][source],
        'sourceTrust': cfg['engine']['sourceTrust'][source],
        'category': category,
        'categoryLabel': cat['label'],
        'urgencyLevel': p.get('urgency') if p.get('urgency') is not None else None,
        'hasPaymentRequest': has_payment_request,
        'viaQr': via_qr,
        'url': url['input'] if url else None,
    }

# ---------------------------------------------------------------- features (all values in 0..1, 2 decimals)

def _compute_features(ctx, cfg):
    text = ctx['text']
    qr = ctx['qr']
    url = ctx['url']
    pay = ctx['pay']
    behaviour = ctx['behaviour']
    K = cfg['engine']['params']
    cat = cfg['engine']['categories'][pay['category']]
    claim = cat['claim']
    verified = pay['recipientChecked'] and pay['recipientVerified']
    F = {}
    D = {}

    # recipientNovelty
    if pay['recipient'] is None:
        F['recipientNovelty'] = K['noveltyUnchecked'] if pay['hasPaymentRequest'] else 0
        D['recipientNovelty'] = ('The payment request does not name a recipient that can be verified.'
                                 if pay['hasPaymentRequest'] else 'No recipient identified.')
    elif not pay['recipientChecked']:
        F['recipientNovelty'] = K['noveltyUnchecked']
        D['recipientNovelty'] = 'Recipient ' + pay['recipient'] + ' has not been checked yet.'
    else:
        n = pay['previousPayments']
        if n == 0:
            v = K['noveltyNever']
            d = 'You have never paid ' + pay['recipient'] + ' before.'
        elif n <= K['noveltyFewMax']:
            v = K['noveltyFew']
            d = ('Only 1 previous payment to ' + pay['recipient'] + '.' if n == 1
                 else 'Only ' + str(n) + ' previous payments to ' + pay['recipient'] + '.')
        else:
            v = 0
            d = str(n) + ' previous payments to ' + pay['recipient'] + '.'
        if verified:
            v = v * K['noveltyVerifiedFactor']
            d += ' The recipient is verified.'
        F['recipientNovelty'] = _r2(v)
        D['recipientNovelty'] = d

    # urgency
    urgency_cues = list(text['cues']['urgency'])
    if qr and qr['urgentFlag']:
        urgency_cues.append('QR marked urgent')
    if pay['urgencyLevel'] is not None:
        F['urgency'] = cfg['engine']['urgencyLevels'][pay['urgencyLevel']]
        D['urgency'] = 'Urgency set to ' + pay['urgencyLevel'] + '.'
    elif len(urgency_cues) > 0:
        F['urgency'] = _r2(min(1, K['urgencyPerCue'] * len(urgency_cues)))
        D['urgency'] = 'Pressure to act fast: ' + ', '.join(urgency_cues) + '.'
    else:
        F['urgency'] = 0
        D['urgency'] = 'No urgency language detected.'

    # impersonation
    authority = text['cues']['authority']
    claim_strength = min(1, K['authorityPerCue'] * len(authority) + (K['impersonationUnverifiedBonus'] if cat['org'] else 0))
    if len(authority) == 0:
        F['impersonation'] = 0
        D['impersonation'] = 'No organisation is being claimed.'
    elif verified:
        F['impersonation'] = _r2(claim_strength * K['impersonationVerifiedFactor'] * (1 - pay['sourceTrust']))
        D['impersonation'] = ('Claims to be ' + claim + '; the payee is verified but the request came via ' + pay['sourceLabel'] + '.'
                              if F['impersonation'] > 0
                              else 'Claims to be ' + claim + ' and the payee is a verified account.')
    else:
        F['impersonation'] = _r2(claim_strength)
        D['impersonation'] = 'Claims to be ' + claim + ' (' + ', '.join(authority) + ') but the payee is not a verified account.'

    # amountAnomaly
    if pay['amount'] is None:
        F['amountAnomaly'] = 0
        D['amountAnomaly'] = 'No amount specified.'
    elif pay['amountUnusual'] is True:
        F['amountAnomaly'] = K['amountUnusualOverride']
        D['amountAnomaly'] = fmt_inr(pay['amount']) + ' is flagged as unusual for you.'
    elif pay['amountUnusual'] is False:
        F['amountAnomaly'] = 0
        D['amountAnomaly'] = fmt_inr(pay['amount']) + ' is marked as a usual amount.'
    else:
        ratio = pay['amount'] / max(1, pay['typicalAmount'])
        v = 0 if ratio <= K['amountRatioStart'] else min(1, (ratio - K['amountRatioStart']) / K['amountRatioSpan'])
        F['amountAnomaly'] = _r2(v)
        D['amountAnomaly'] = (fmt_inr(pay['amount']) + ' is within your usual range.' if v == 0
                              else fmt_inr(pay['amount']) + ' is ' + _fmt_num(_r1(ratio)) + 'x your typical ' + fmt_inr(pay['typicalAmount']) + ' payment.')

    # suspiciousURL
    if not url:
        F['suspiciousURL'] = 0
        D['suspiciousURL'] = 'No link involved.'
    elif not url['valid']:
        F['suspiciousURL'] = 0
        D['suspiciousURL'] = 'The link could not be parsed.'
    elif K['urlIgnoredForOfficialApp'] and pay['source'] == 'official_app':
        F['suspiciousURL'] = 0
        D['suspiciousURL'] = 'Paying inside the official app, so the link is not in the payment path.'
    else:
        F['suspiciousURL'] = _r2(url['score'] / 100)
        D['suspiciousURL'] = url['host'] + ' scored ' + str(url['score']) + '/100 in link checks.'

    # qrRedirection
    if not pay['viaQr']:
        F['qrRedirection'] = 0
        D['qrRedirection'] = 'No payment QR involved.'
    elif verified:
        F['qrRedirection'] = 0
        D['qrRedirection'] = 'The QR pays a verified account.'
    else:
        F['qrRedirection'] = _r2(min(1, (K['qrMerchantClaimed'] if pay['merchant'] is not None else K['qrNoMerchant']) + (1 - pay['sourceTrust']) * K['qrSourceFactor']))
        D['qrRedirection'] = ("The QR shows '" + pay['merchant'] + "' but pays an unverified account (" + (pay['recipient'] if pay['recipient'] is not None else 'unknown') + ').'
                              if pay['merchant'] is not None
                              else 'The QR pays an unverified account (' + (pay['recipient'] if pay['recipient'] is not None else 'unknown') + ').')

    # socialEngineering
    se_cues = list(text['cues']['threat']) + list(text['cues']['lure']) + list(text['cues']['secrecy']) + list(text['cues']['credential'])
    F['socialEngineering'] = _r2(min(1,
        K['seThreat'] * text['counts']['threat'] + K['seLure'] * text['counts']['lure'] +
        K['seSecrecy'] * text['counts']['secrecy'] + K['seCredential'] * text['counts']['credential']))
    D['socialEngineering'] = ('Manipulation cues: ' + ', '.join(se_cues) + '.' if len(se_cues) > 0
                              else 'No pressure, lure or secrecy tactics detected.')

    # contextMismatch
    ctx_v = 0
    parts = []
    if cat['org'] and pay['source'] in cfg['engine']['personalChannels']:
        ctx_v += K['ctxOrgViaPersonal']
        parts.append(_capitalize(claim) + ' does not normally contact you via ' + pay['sourceLabel'] + '.')
    if cat['neverCollects'] and pay['hasPaymentRequest']:
        ctx_v += K['ctxNeverCollects']
        parts.append('Genuine ' + cat['label'] + ' processes do not ask you to pay.')
    if pay['hasPaymentRequest'] and pay['recipient'] is not None and not verified and (pay['merchant'] is not None or cat['org']):
        ctx_v += K['ctxClaimedUnverified']
        parts.append('The payee does not match the claimed ' +
                     ("merchant '" + pay['merchant'] + "'." if pay['merchant'] is not None else 'organisation.'))
    F['contextMismatch'] = _r2(min(1, ctx_v))
    D['contextMismatch'] = (' '.join(parts) if len(parts) > 0 else 'The payment context is consistent.')

    # behaviouralAnomaly
    B = K['behaviour']
    b_flags = []
    b_v = 0
    b_names = {
        'onCall': 'on a phone call',
        'screenShare': 'screen sharing active',
        'newDevice': 'new device',
        'lateNight': 'late-night payment',
        'rapidAttempts': 'repeated payment attempts',
    }
    for k in ['onCall', 'screenShare', 'newDevice', 'lateNight', 'rapidAttempts']:
        if behaviour and behaviour.get(k) is True:
            b_v += B[k]
            b_flags.append(b_names[k])
    F['behaviouralAnomaly'] = _r2(min(1, b_v))
    D['behaviouralAnomaly'] = ('Session risk: ' + ', '.join(b_flags) + '.' if len(b_flags) > 0
                               else 'No unusual session behaviour.')

    # untrustedSource
    F['untrustedSource'] = _r2(1 - pay['sourceTrust'])
    D['untrustedSource'] = 'Request arrived via ' + pay['sourceLabel'] + ' (source trust ' + str(_pct(pay['sourceTrust'])) + '%).'

    return {'values': F, 'details': D}

# ---------------------------------------------------------------- combos, scoring, patterns

def _cond_holds(c, F):
    return F[c['feature']] >= c['min']

def _match_combos(F, pay, cfg):
    verified = pay['recipientChecked'] and pay['recipientVerified']
    out = []
    for c in cfg['patterns']['combos']:
        if not all(_cond_holds(x, F) for x in c['all']):
            continue
        if c.get('category') is not None and c['category'] != pay['category']:
            continue
        if c.get('paymentRequest') is True and not pay['hasPaymentRequest']:
            continue
        if c.get('recipientUnverified') is True and verified:
            continue
        if c.get('viaQr') is True and not pay['viaQr']:
            continue
        out.append(c)
    return out

def _score_features(F, D, combos, cfg):
    E = cfg['engine']
    contributions = [{
        'key': 'baseline',
        'label': 'Baseline residual risk',
        'kind': 'baseline',
        'value': 1,
        'weight': E['baseline'],
        'points': E['baseline'],
        'severity': 'none',
        'detail': 'Every payment carries a small residual risk.',
    }]
    for k in FACTOR_KEYS:
        pts = _points_for(E['weights'][k], F[k])
        if pts == 0:
            continue
        contributions.append({
            'key': k,
            'label': E['factorLabels'][k],
            'kind': 'factor',
            'value': F[k],
            'weight': E['weights'][k],
            'points': pts,
            'severity': _severity_of(F[k], E['thresholds']),
            'detail': D[k],
        })
    for c in combos:
        contributions.append({
            'key': 'combo:' + c['id'],
            'label': 'Signals connected: ' + c['name'],
            'kind': 'combo',
            'value': 1,
            'weight': c['points'],
            'points': c['points'],
            'severity': 'high',
            'detail': 'These signals appeared together, a known scam combination.',
        })
    total = sum(c['points'] for c in contributions)
    score = _clamp(total, 0, 100)
    return {'contributions': contributions, 'score': score, 'clamped': score != total}

def _detect_patterns(F, pay, score, combos, cfg):
    P = cfg['patterns']
    patterns = []
    primary = None
    if score >= P['minScoreForPattern']:
        for p in P['primary']:
            if p['category'] == pay['category'] and any(_cond_holds(x, F) for x in p['anyOf']):
                primary = p
                break
    mods = ([m for m in P['modifiers'] if F[m['feature']] >= m['min']][:P['maxModifiers']]
            if score >= P['minScoreForPattern'] else [])
    if primary:
        patterns.append({'id': primary['id'], 'name': primary['name'], 'kind': 'primary'})
    for m in mods:
        patterns.append({'id': m['id'], 'name': m['name'], 'kind': 'modifier'})
    for c in combos:
        patterns.append({'id': c['id'], 'name': c['name'], 'kind': 'combo'})
    if score < P['minScoreForPattern']:
        pattern_name = P['noPatternName']
    elif primary:
        pattern_name = ' + '.join([primary['name']] + [m['name'] for m in mods])
    elif len(mods) > 0:
        pattern_name = ' + '.join(m['name'] for m in mods)
    else:
        pattern_name = P['genericPatternName']
    return {'patterns': patterns, 'patternName': pattern_name}

# ---------------------------------------------------------------- explainability

_PHRASES = [
    ('recipientNovelty', 'an unfamiliar recipient'),
    ('urgency', 'urgent language'),
    ('context', 'a payment context inconsistent with the claimed organization'),
    ('suspiciousURL', 'a suspicious link'),
    ('qrRedirection', 'a QR code that redirects to an unverified account'),
    ('amountAnomaly', 'an unusual amount'),
    ('socialEngineering', 'pressure or lure tactics'),
    ('behaviouralAnomaly', 'a risky session such as an ongoing call'),
    ('untrustedSource', 'a low-trust channel'),
]
_HEADLINES = {
    'HIGH': 'Multiple warning signals detected',
    'HIGH_CAUTION': 'Potentially risky payment situation',
    'CAUTION': 'Some warning signals detected',
    'LOW': 'No significant warning signals detected',
}

def _trust_signals_for(F, pay, url, text):
    out = []
    if pay['recipient'] is not None and pay['recipientChecked'] and pay['previousPayments'] >= 3:
        out.append('Familiar recipient')
    if pay['recipient'] is not None and pay['recipientChecked'] and pay['recipientVerified']:
        out.append('Verified recipient')
    if pay['amount'] is not None and F['amountAnomaly'] == 0:
        out.append('Normal payment range')
    if pay['source'] == 'official_app':
        out.append('Official demo source')
    elif pay['sourceTrust'] >= 0.8:
        out.append('Trusted source (' + pay['sourceLabel'] + ')')
    if F['urgency'] == 0:
        out.append('No urgency')
    if url and url['valid'] and url['reputation'] == 'trusted':
        out.append('Link is on the demo allowlist')
    if (F['contextMismatch'] == 0 and F['impersonation'] == 0 and F['socialEngineering'] == 0
            and F['suspiciousURL'] < 0.3 and F['behaviouralAnomaly'] == 0 and F['qrRedirection'] == 0):
        out.append('No suspicious context detected')
    return out

def _build_explanation(F, contributions, level, pay, url, text):
    trust_signals = _trust_signals_for(F, pay, url, text)
    if level == 'LOW':
        parts = []
        if 'Familiar recipient' in trust_signals or 'Verified recipient' in trust_signals:
            parts.append('familiar recipient')
        if 'Normal payment range' in trust_signals:
            parts.append('normal amount')
        if pay['source'] == 'official_app':
            parts.append('official demo source')
        elif pay['sourceTrust'] >= 0.8:
            parts.append('trusted source')
        summary = (_capitalize(', '.join(parts)) + ', and no significant suspicious context detected.'
                   if len(parts) > 0 else 'No significant suspicious context detected.')
    else:
        chosen = []
        for (key, phrase) in _PHRASES:
            v = max(F['contextMismatch'], F['impersonation']) if key == 'context' else F[key]
            if v >= 0.4:
                chosen.append(phrase)
            if len(chosen) == 3:
                break
        summary = ('The payment request is associated with ' + _join_list(chosen) + '.'
                   if len(chosen) > 0 else 'Several weaker warning signals appeared together.')
    ranked = sorted([c for c in contributions if c['kind'] != 'baseline'], key=lambda c: -c['points'])
    reasons = [c['detail'] + ' (+' + str(c['points']) + ')' for c in ranked]
    return {
        'headline': _HEADLINES[level],
        'summary': summary,
        'reasons': reasons,
        'trustSignals': trust_signals,
        'disclaimer': DISCLAIMER,
    }

_ACTIONS = {
    'verify': 'VERIFY OFFICIALLY',
    'cancel': 'CANCEL',
    'trusted': 'ASK TRUSTED CONTACT',
    'analysis': 'VIEW FULL ANALYSIS',
    'continue': 'CONTINUE (SIMULATION)',
}
_RECOMMENDATIONS = {
    'HIGH': {
        'verdict': 'DONT_PAY_YET',
        'title': "DON'T PAY YET",
        'message': 'Multiple warning signals detected. Pause and verify through official channels before paying.',
        'actions': ['verify', 'cancel', 'trusted', 'analysis'],
    },
    'HIGH_CAUTION': {
        'verdict': 'VERIFY_FIRST',
        'title': 'VERIFY BEFORE PAYING',
        'message': 'This payment looks potentially risky. Confirm the recipient through an official channel first.',
        'actions': ['verify', 'trusted', 'cancel', 'analysis'],
    },
    'CAUTION': {
        'verdict': 'PROCEED_WITH_CARE',
        'title': 'PROCEED WITH CARE',
        'message': 'Some warning signals were found. Double-check the recipient and amount before paying.',
        'actions': ['verify', 'analysis', 'cancel'],
    },
    'LOW': {
        'verdict': 'LOOKS_SAFE',
        'title': 'LOW RISK',
        'message': 'No significant warning signals detected. Keep paying only inside official apps.',
        'actions': ['continue', 'analysis'],
    },
}

def _build_recommendation(level):
    r = _RECOMMENDATIONS[level]
    return {
        'verdict': r['verdict'],
        'title': r['title'],
        'message': r['message'],
        'actions': [{'id': id_, 'label': _ACTIONS[id_]} for id_ in r['actions']],
    }

def _build_attack_chain(F, pay, url, text, score, lvl, cfg):
    T = cfg['engine']['thresholds']
    sev = lambda v: _severity_of(v, T)
    verdict_sev = ('high' if lvl['id'] in ('HIGH', 'HIGH_CAUTION') else
                   'medium' if lvl['id'] == 'CAUTION' else 'low')
    msg_v = max(F['urgency'], F['impersonation'], F['socialEngineering'])
    nodes = [
        {
            'id': 'message',
            'icon': '📱',
            'label': 'Message',
            'active': not text['empty'],
            'detail': ('No message' if text['empty'] else
                       ('Suspicious message received' if msg_v >= 0.4 else 'Message received')),
            'severity': sev(msg_v) if not text['empty'] else 'none',
        },
        {
            'id': 'urgency',
            'icon': '⚠️',
            'label': 'Urgency',
            'active': F['urgency'] > 0,
            'detail': 'Pressure to act fast' if F['urgency'] > 0 else 'No urgency',
            'severity': sev(F['urgency']),
        },
        {
            'id': 'url',
            'icon': '🌐',
            'label': 'Suspicious URL',
            'active': F['suspiciousURL'] >= 0.3,
            'detail': (url['host'] + ' (' + str(url['score']) + '/100)' if url and url['valid'] else 'No link'),
            'severity': sev(F['suspiciousURL']),
        },
        {
            'id': 'qr',
            'icon': '📷',
            'label': 'QR Code',
            'active': pay['viaQr'],
            'detail': ((pay['merchant'] if pay['merchant'] is not None else
                        (pay['recipient'] if pay['recipient'] is not None else 'Payment QR'))
                       if pay['viaQr'] else 'No QR'),
            'severity': sev(F['qrRedirection']) if pay['viaQr'] else 'none',
        },
        {
            'id': 'recipient',
            'icon': '👤',
            'label': 'Unknown Recipient',
            'active': F['recipientNovelty'] >= 0.5,
            'detail': pay['recipient'] if pay['recipient'] is not None else 'No recipient',
            'severity': sev(F['recipientNovelty']),
        },
        {
            'id': 'payment',
            'icon': '💰',
            'label': 'Payment Request',
            'active': pay['hasPaymentRequest'],
            'detail': (fmt_inr(pay['amount']) if pay['amount'] is not None else 'Payment requested'),
            'severity': (sev(max(F['amountAnomaly'], F['contextMismatch'])) if pay['hasPaymentRequest'] else 'none'),
        },
        {
            'id': 'verdict',
            'icon': ('✅' if lvl['id'] == 'LOW' else '⚠️' if lvl['id'] == 'CAUTION' else '🚨'),
            'label': lvl['label'],
            'active': True,
            'detail': str(score) + '/100',
            'severity': verdict_sev,
        },
    ]
    return nodes

# ---------------------------------------------------------------- pipeline

def _clean_input(input_dict):
    out = {}
    for k in ['message', 'url', 'qrText', 'scenarioId']:
        v = input_dict.get(k)
        if isinstance(v, str) and v.strip() != '':
            out[k] = v
    p = input_dict.get('payment')
    if p and len(p) > 0:
        out['payment'] = dict(p)
    b = input_dict.get('behaviour')
    if b and len(b) > 0:
        out['behaviour'] = dict(b)
    return out

def analyze(raw_input: dict | None, cfg: dict, runtime: str = 'python') -> dict[str, Any]:
    """Full risk analysis pipeline. Returns a RiskReport."""
    input_dict = _clean_input(raw_input if raw_input is not None else {})
    qr = parse_qr(input_dict['qrText'], cfg) if 'qrText' in input_dict else None
    combined_text_parts = [input_dict.get('message') or '']
    if qr and qr['fields'].get('merchant'):
        combined_text_parts.append(qr['fields']['merchant'])
    else:
        combined_text_parts.append('')
    if qr and qr['fields'].get('note'):
        combined_text_parts.append(qr['fields']['note'])
    else:
        combined_text_parts.append('')
    combined_text = '\n'.join(x for x in combined_text_parts if x != '')
    text = analyze_text(combined_text, cfg)
    message_urls = _extract_urls(input_dict.get('message') or '')
    url_input = input_dict.get('url')
    if url_input is None:
        if len(message_urls) > 0:
            url_input = message_urls[0]
        elif qr and qr['format'] == 'url':
            url_input = qr['fields'].get('url')
        else:
            url_input = None
    url = analyze_url(url_input, cfg) if url_input is not None else None
    pay = _resolve_payment(input_dict, text, qr, url, cfg)
    ctx = {'text': text, 'qr': qr, 'url': url, 'pay': pay, 'behaviour': input_dict.get('behaviour') or {}}
    feat = _compute_features(ctx, cfg)
    F = feat['values']
    D = feat['details']
    combos = _match_combos(F, pay, cfg)
    scored = _score_features(F, D, combos, cfg)
    contributions = scored['contributions']
    score = scored['score']
    clamped = scored['clamped']
    lvl = level_for(score, cfg)
    det = _detect_patterns(F, pay, score, combos, cfg)
    patterns = det['patterns']
    pattern_name = det['patternName']
    T = cfg['engine']['thresholds']
    dna = []
    for k in DNA_KEYS:
        c = next((x for x in contributions if x['key'] == k), None)
        dna.append({
            'key': k,
            'label': DNA_LABELS[k],
            'value': F[k],
            'percent': _pct(F[k]),
            'severity': _severity_of(F[k], T),
            'points': c['points'] if c else 0,
        })
    features = {**F, 'recipientVerified': 1 if (pay['recipientChecked'] and pay['recipientVerified']) else 0, 'sourceTrust': pay['sourceTrust']}
    return {
        'id': _report_id(input_dict, score),
        'simulation': True,
        'notice': SIMULATION_NOTICE,
        'engine': {'name': cfg['engine']['engineName'], 'version': cfg['engine']['version'], 'runtime': runtime},
        'input': input_dict,
        'analyses': {'text': text, 'url': url, 'qr': qr},
        'payment': pay,
        'features': features,
        'featureDetails': D,
        'contributions': contributions,
        'score': score,
        'clamped': clamped,
        'level': lvl['id'],
        'levelLabel': lvl['label'],
        'dna': dna,
        'patterns': patterns,
        'patternName': pattern_name,
        'attackChain': _build_attack_chain(F, pay, url, text, score, lvl, cfg),
        'explanation': _build_explanation(F, contributions, lvl['id'], pay, url, text),
        'recommendation': _build_recommendation(lvl['id']),
    }

def apply_patch(inp: dict, patch: dict) -> dict:
    """Deep-merges a sequence patch into an input (payment/behaviour merged, other keys replaced)."""
    out = dict(inp)
    for k, v in (patch if patch is not None else {}).items():
        if k in ('payment', 'behaviour') and v and isinstance(v, dict):
            out[k] = {**(inp.get(k) or {}), **v}
        else:
            out[k] = v
    return out

def scenario_input(s: dict) -> dict:
    """Build an input dict from a scenario."""
    input_dict = {'scenarioId': s['id']}
    if s.get('message'):
        input_dict['message'] = s['message']
    if s.get('url'):
        input_dict['url'] = s['url']
    if s.get('qrText'):
        input_dict['qrText'] = s['qrText']
    if s.get('payment') and len(s['payment']) > 0:
        input_dict['payment'] = dict(s['payment'])
    if s.get('behaviour') and len(s['behaviour']) > 0:
        input_dict['behaviour'] = dict(s['behaviour'])
    return input_dict
