"""AI bank auditor: OmniRoute (OpenAI-compatible) with a deterministic simulated fallback.

The only outbound call in PAYRAKSHA, made to the operator's own LAN model server (OMNIROUTE_BASE_URL). It receives
aggregates and masked vendor identifiers only, never customer names, PINs, OTPs or account numbers.
"""
from __future__ import annotations

import json
import os
import re
import time

import httpx

BASE_URL = os.environ.get('OMNIROUTE_BASE_URL', 'http://192.168.0.146:20128/v1').rstrip('/')
MODEL = os.environ.get('PAYRAKSHA_AUDIT_MODEL', 'bedrock/zai.glm-5')
API_KEY = os.environ.get('OMNIROUTE_API_KEY', 'payraksha-demo')
TIMEOUT_S = float(os.environ.get('PAYRAKSHA_AUDIT_TIMEOUT', '75'))

VERDICTS = ('LIKELY_SAFE', 'CAUTION', 'SUSPICIOUS', 'HIGH_RISK')

SYSTEM = """You are the AI Transaction Auditor of a bank's fraud-risk office, auditing ONE simulated UPI QR payment to a vendor
before the customer pays. This is a hackathon DEMO: every record is simulated.
Audit like a careful bank auditor: go through the evidence table by table, cross-check the vendor's identity (KYC,
verification, age, look-alike/impersonation of a known brand), the vendor's dispute and complaint record, how this
payment compares with the vendor's normal ticket size and with the customer's own history with this vendor, and the
payment-context signals from the rules engine.
Rules:
- Never state fraud as a certainty. Use wording like "Suspicious", "Potentially risky", "Multiple warning signals detected".
- Protect vendor privacy: refer to the vendor by name only, never repeat GSTIN, settlement account or VPA fragments.
- Never ask for or mention PIN, OTP, passwords, CVV or card numbers except to warn that a real bank never asks for them.
- score is 0-100, higher = riskier. verdict is one of LIKELY_SAFE (<30), CAUTION (30-54), SUSPICIOUS (55-74), HIGH_RISK (>=75).
- Each reasoning step must cite the evidence (table.field = value) it used.
Reply with ONLY a JSON object, no markdown:
{"score": int, "verdict": str, "headline": str (<=90 chars), "summary": str (2-3 sentences),
 "reasoning": [{"title": str, "detail": str, "evidence": [str], "impact": "raises"|"lowers"|"neutral"}] (4-7 steps),
 "vendorIssues": [str], "securityIssues": [str], "recommendation": str, "privacyNote": str}"""


def verdict_for(score: int) -> str:
    return 'LIKELY_SAFE' if score < 30 else 'CAUTION' if score < 55 else 'SUSPICIOUS' if score < 75 else 'HIGH_RISK'


def _clean(obj: dict, fallback: dict) -> dict:
    out = dict(fallback)
    try:
        s = int(round(float(obj.get('score'))))
        out['score'] = max(0, min(100, s))
    except Exception:
        pass
    out['verdict'] = obj.get('verdict') if obj.get('verdict') in VERDICTS else verdict_for(out['score'])
    for k in ('headline', 'summary', 'recommendation', 'privacyNote'):
        if isinstance(obj.get(k), str) and obj[k].strip():
            out[k] = obj[k].strip()[:600]
    steps = []
    for st in obj.get('reasoning') or []:
        if isinstance(st, dict) and st.get('title'):
            steps.append({'title': str(st['title'])[:120], 'detail': str(st.get('detail', ''))[:700],
                          'evidence': [str(e)[:160] for e in (st.get('evidence') or [])][:6],
                          'impact': st.get('impact') if st.get('impact') in ('raises', 'lowers', 'neutral') else 'neutral'})
    if steps:
        out['reasoning'] = steps[:8]
    for k in ('vendorIssues', 'securityIssues'):
        if isinstance(obj.get(k), list):
            out[k] = [str(x)[:240] for x in obj[k] if str(x).strip()][:6]
    return out


def _extract_json(text: str) -> dict:
    text = re.sub(r'^```(?:json)?|```$', '', text.strip(), flags=re.M).strip()
    m = re.search(r'\{.*\}', text, re.S)
    return json.loads(m.group(0) if m else text)


def simulated_audit(ev: dict) -> dict:
    """Deterministic auditor used when the model is unreachable, and for quick checks on small payments."""
    v, st, me, pay, eng = ev['vendor'], ev['vendorStats'], ev['customerHistory'], ev['payment'], ev['engineSignals']
    steps, score = [], 8
    def step(title, detail, evidence, delta):
        nonlocal score
        score += delta
        steps.append({'title': title, 'detail': detail, 'evidence': evidence,
                      'impact': 'raises' if delta > 0 else 'lowers' if delta < 0 else 'neutral'})
    if v['impostorOf']:
        step('Look-alike of a known brand', f"The vendor name imitates {v['impostorOf']} but is a separate, unverified merchant.",
             [f"vendors.impostor_of = {v['impostorOf']}", f"vendors.name = {v['name']}"], 38)
    kyc_delta = 0 if v['kycStatus'] == 'verified' else 22 if v['kycStatus'] == 'failed' else 14
    step('Merchant KYC', f"KYC status is {v['kycStatus']}.", [f"vendors.kyc_status = {v['kycStatus']}", f"vendors.verified = {v['verified']}"], kyc_delta)
    age = st['vendorAgeDays']
    step('Merchant age', f'Merchant onboarded {age} days ago.', [f'vendors.onboarded_at = {age} days ago'], 14 if age < 30 else -4 if age > 365 else 0)
    dr = st['disputeRatePct']
    step('Dispute record', f"{st['disputes']} disputes on {st['txCount']} payments ({dr}%).",
         [f"disputes.count = {st['disputes']}", f"transactions.count = {st['txCount']}"], 18 if dr >= 10 else 8 if dr >= 3 else -3)
    ratio = pay['vsAvgTicket']
    step('Amount vs normal ticket', f'This payment is {ratio}x the vendor average ticket.',
         [f"transactions.avg_amount = ₹{st['avgTicket']}", f"payment.amount = ₹{pay['amount']}"], 10 if ratio >= 5 else 4 if ratio >= 2 else 0)
    step('Your history with this vendor', f"{me['count']} earlier payments by this customer.",
         [f"transactions(customer).count = {me['count']}"], 5 if me['count'] == 0 else -5 if me['count'] >= 10 else 0)
    step('Payment-context signals', f"Rules engine score {eng['score']} ({eng['level']}).", [f'engine.{r}' for r in eng['reasons'][:3]] or ['engine.no_signals'],
         round(eng['score'] * 0.15))
    score = max(0, min(100, score))
    verdict = verdict_for(score)
    vendor_issues = [s['detail'] for s in steps if s['impact'] == 'raises' and s['title'] in (
        'Look-alike of a known brand', 'Merchant KYC', 'Merchant age', 'Dispute record')]
    security = []
    if v['impostorOf']:
        security.append('Brand impersonation pattern: payment requests from look-alike merchant names are a common scam route.')
    if pay['amount'] >= 10000:
        security.append('High-value payment: verify the merchant through the official app or website before paying.')
    security.append('A real bank never asks for your UPI PIN or OTP to receive money or a refund.')
    headline = {'LIKELY_SAFE': 'Low risk: established, verified merchant',
                'CAUTION': 'Caution: a few points to verify before paying',
                'SUSPICIOUS': 'Suspicious: potentially risky merchant or payment',
                'HIGH_RISK': 'Multiple warning signals detected'}[verdict]
    return {'score': score, 'verdict': verdict, 'headline': headline,
            'summary': f"{v['name']} scored {score}/100 on the bank's simulated audit. " + (
                'Multiple warning signals were found in the vendor record.' if score >= 55 else 'No major warning signals in the vendor record.'),
            'reasoning': steps, 'vendorIssues': vendor_issues, 'securityIssues': security,
            'recommendation': 'Cancel and verify the merchant through official channels.' if score >= 55 else
                              'Proceed only if the amount and merchant match what you expect.' if score >= 30 else
                              'Looks consistent with this merchant\'s normal activity.',
            'privacyNote': 'Vendor identifiers were masked; only aggregate statistics were used.'}


# Live view of each audit for the bank-internal auditor portal: the prompt, the streamed model text and the raw response.
# Kept in memory only (never persisted, never shown to the customer).
LIVE: dict[int, dict] = {}


def _stream_chat(messages: list[dict], live: dict) -> str:
    """Streams an OpenAI-compatible chat completion, appending text (and any reasoning_content) to `live` as it arrives."""
    with httpx.stream('POST', f'{BASE_URL}/chat/completions', timeout=TIMEOUT_S,
                      headers={'Authorization': f'Bearer {API_KEY}', 'Content-Type': 'application/json'},
                      json={'model': MODEL, 'temperature': 0.2, 'max_tokens': 2200, 'stream': True,
                            'messages': messages}) as r:
        r.raise_for_status()
        for line in r.iter_lines():
            if not line.startswith('data:'):
                continue
            data = line[5:].strip()
            if data == '[DONE]':
                break
            try:
                chunk = json.loads(data)
            except ValueError:
                continue
            live['chunks'] += 1
            for ch in chunk.get('choices') or []:
                d = ch.get('delta') or ch.get('message') or {}
                live['thinking'] += d.get('reasoning_content') or d.get('reasoning') or ''
                live['text'] += d.get('content') or ''
                if ch.get('finish_reason'):
                    live['finishReason'] = ch['finish_reason']
            if chunk.get('usage'):
                live['usage'] = chunk['usage']
            if chunk.get('model'):
                live['servedModel'] = chunk['model']
    return live['text']


def run_ai_audit(evidence: dict, rid: int | None = None) -> tuple[dict, str, str, int]:
    """Returns (report, source, model, latency_ms). Falls back to the simulated auditor on any failure."""
    fallback = simulated_audit(evidence)
    t0 = time.time()
    messages = [{'role': 'system', 'content': SYSTEM},
                {'role': 'user', 'content': 'Evidence pulled from the bank database (JSON):\n' +
                 json.dumps(evidence, ensure_ascii=False, default=str)}]
    live = {'model': MODEL, 'endpoint': f'{BASE_URL}/chat/completions', 'messages': messages, 'text': '', 'thinking': '',
            'chunks': 0, 'status': 'streaming', 'error': None, 'finishReason': None, 'usage': None, 'servedModel': None,
            'parsed': None, 'startedAt': t0}
    if rid is not None:
        LIVE[rid] = live
        while len(LIVE) > 50:
            LIVE.pop(next(iter(LIVE)))
    if os.environ.get('PAYRAKSHA_AUDIT_AI', '1') == '0':
        live.update(status='simulated', error='AI disabled (PAYRAKSHA_AUDIT_AI=0): simulated auditor used.', parsed=fallback)
        return fallback, 'simulated', 'simulated-auditor', 0
    try:
        content = _stream_chat(messages, live)
        if not content.strip():
            raise ValueError('empty model response')
        rep = _clean(_extract_json(content), fallback)
        live.update(status='done', parsed=rep)
        return rep, 'ai', MODEL, int((time.time() - t0) * 1000)
    except Exception as e:  # noqa: BLE001
        live.update(status='fallback', error=f'{type(e).__name__}: {e}'[:300], parsed=fallback)
        return fallback, 'simulated', 'simulated-auditor (AI unreachable)', int((time.time() - t0) * 1000)
