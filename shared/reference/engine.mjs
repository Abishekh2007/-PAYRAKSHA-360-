// PAYRAKSHA 360 — reference Contextual Risk Engine (the executable specification).
//
// src/engine/*.ts (on-device fallback) and backend/app/engine/*.py (primary API) are
// line-by-line ports of this file. Both must reproduce shared/golden/*.json exactly
// (every field except engine.runtime). Pure functions: no I/O, no clock, no randomness.
// All weights, thresholds and word lists live in shared/*.json — nothing is hard-coded.
//
// SIMULATION ONLY: this engine analyses demo data. It never initiates a payment.

export const ENGINE_VERSION = '1.0.0';

export const CUE_GROUPS = ['urgency', 'threat', 'authority', 'paymentRequest', 'lure', 'secrecy', 'credential'];
export const FACTOR_KEYS = ['recipientNovelty', 'urgency', 'impersonation', 'amountAnomaly', 'suspiciousURL', 'qrRedirection', 'socialEngineering', 'contextMismatch', 'behaviouralAnomaly', 'untrustedSource'];
export const DNA_KEYS = ['urgency', 'impersonation', 'recipientNovelty', 'amountAnomaly', 'suspiciousURL', 'qrRedirection', 'socialEngineering', 'contextMismatch', 'behaviouralAnomaly'];
export const DNA_LABELS = {
  urgency: 'Urgency', impersonation: 'Impersonation', recipientNovelty: 'Unknown Recipient', amountAnomaly: 'Amount Anomaly',
  suspiciousURL: 'Suspicious URL', qrRedirection: 'QR Redirection', socialEngineering: 'Social Engineering',
  contextMismatch: 'Context Mismatch', behaviouralAnomaly: 'Behavioural Anomaly',
};
export const DISCLAIMER = 'PAYRAKSHA does not treat any single signal as proof of fraud. Multiple contextual signals are evaluated together.';
export const SIMULATION_NOTICE = 'SIMULATION / DEMO — no real payment was initiated.';

// ---------------------------------------------------------------- numeric + string helpers
// Every port must implement these exactly (Python: math.floor, never round()).
export function r2(v) { return Math.floor(v * 100 + 0.5) / 100; }
export function r1(v) { return Math.floor(v * 10 + 0.5) / 10; }
export function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
export function pointsFor(weight, value) { return Math.floor(weight * value + 0.5); }
export function pct(v) { return Math.floor(v * 100 + 0.5); }
// Shortest decimal form: 3 -> "3", 2.7 -> "2.7". Python: str(int(v)) if v == int(v) else repr(v)
export function fmtNum(v) { return String(v); }
// Indian digit grouping with a rupee sign: 1999 -> "₹1,999", 1500000 -> "₹15,00,000", 10.5 -> "₹10.50"
export function fmtINR(n) {
  const neg = n < 0;
  const abs = Math.abs(n);
  const whole = Math.floor(abs);
  const cents = Math.floor((abs - whole) * 100 + 0.5);
  let s = String(whole);
  if (s.length > 3) {
    const last3 = s.slice(-3);
    let rest = s.slice(0, -3);
    const parts = [];
    while (rest.length > 2) { parts.unshift(rest.slice(-2)); rest = rest.slice(0, -2); }
    if (rest.length > 0) parts.unshift(rest);
    s = parts.join(',') + ',' + last3;
  }
  if (cents > 0) s += '.' + String(cents).padStart(2, '0');
  return (neg ? '-' : '') + '₹' + s;
}
// "a" | "a and b" | "a, b, and c"
export function joinList(items) {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return items[0] + ' and ' + items[1];
  return items.slice(0, -1).join(', ') + ', and ' + items[items.length - 1];
}
export function capitalize(s) { return s.length ? s[0].toUpperCase() + s.slice(1) : s; }
export function severityOf(v, thresholds) {
  if (v >= thresholds.severityHigh) return 'high';
  if (v >= thresholds.severityMedium) return 'medium';
  if (v > 0) return 'low';
  return 'none';
}
// FNV-1a 32-bit over Unicode code points. Python: h ^= ord(ch); h = (h * 0x01000193) & 0xFFFFFFFF
export function fnv1a(str) {
  let h = 0x811c9dc5;
  for (const ch of str) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}
export function reportId(input, score) {
  const key = (input.message ?? '') + '|' + (input.url ?? '') + '|' + (input.qrText ?? '') + '|' + score;
  return 'PR-' + fnv1a(key).toString(16).toUpperCase().padStart(8, '0');
}

// ---------------------------------------------------------------- cue matching
export function normalizeText(s) { return (s ?? '').toLowerCase().replace(/[‘’]/g, "'"); }
function isAlnum(ch) { return ch !== '' && 'abcdefghijklmnopqrstuvwxyz0123456789'.includes(ch); }

// Returns the distinct cues (in list order) found in already-normalized text.
// A cue whose first char is [a-z0-9] must not be preceded by [a-z0-9]; a cue whose
// last char is [a-z0-9] must not be followed by [a-z0-9]. Other edges match anywhere.
export function matchCues(t, cues) {
  const found = [];
  for (const cue of cues) {
    if (found.includes(cue)) continue;
    let from = 0;
    while (true) {
      const i = t.indexOf(cue, from);
      if (i < 0) break;
      const before = i === 0 ? '' : t[i - 1];
      const after = i + cue.length >= t.length ? '' : t[i + cue.length];
      const okStart = !isAlnum(cue[0]) || !isAlnum(before);
      const okEnd = !isAlnum(cue[cue.length - 1]) || !isAlnum(after);
      if (okStart && okEnd) { found.push(cue); break; }
      from = i + 1;
    }
  }
  return found;
}

const AMOUNT_RE = /(?:₹|\brs\.?|\binr)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i;
const URL_RE = /\bhttps?:\/\/[^\s<>"']+/gi;

export function extractAmount(text) {
  const m = AMOUNT_RE.exec(text ?? '');
  if (!m) return null;
  const v = parseFloat(m[1].replace(/,/g, ''));
  return Number.isFinite(v) ? r2(v) : null;
}
export function extractUrls(text) {
  const out = [];
  for (const m of (text ?? '').matchAll(URL_RE)) {
    const u = m[0].replace(/[.,;:!?)\]]+$/, '');
    if (!out.includes(u)) out.push(u);
  }
  return out;
}

// ---------------------------------------------------------------- text analysis
const SIGNAL_DEFS = [
  { id: 'urgency', label: 'Urgency', groups: ['urgency'], highAt: 2 },
  { id: 'threat', label: 'Threat language', groups: ['threat'], highAt: 1 },
  { id: 'authority', label: 'Authority impersonation', groups: ['authority'], highAt: 2 },
  { id: 'paymentRequest', label: 'Payment request', groups: ['paymentRequest'], highAt: 2 },
  { id: 'lure', label: 'Social engineering', groups: ['lure'], highAt: 2 },
  { id: 'suspiciousAction', label: 'Suspicious action request', groups: ['secrecy', 'credential'], highAt: 1 },
];

export function analyzeText(text, cfg) {
  const raw = text ?? '';
  const t = normalizeText(raw);
  const cues = {};
  const counts = {};
  for (const g of CUE_GROUPS) {
    cues[g] = matchCues(t, cfg.lexicon.signals[g]);
    counts[g] = cues[g].length;
  }
  const categoryScores = {};
  for (const cat of cfg.engine.categoryPriority) categoryScores[cat] = matchCues(t, cfg.lexicon.categories[cat] ?? []).length;
  let category = 'unknown';
  let best = 0;
  for (const cat of cfg.engine.categoryPriority) {
    if (categoryScores[cat] > best) { best = categoryScores[cat]; category = cat; }
  }
  const signals = SIGNAL_DEFS.map((d) => {
    const list = [];
    for (const g of d.groups) for (const c of cues[g]) list.push(c);
    const n = list.length;
    return { id: d.id, label: d.label, cues: list, count: n, severity: n >= d.highAt ? 'high' : n >= 1 ? 'medium' : 'none' };
  });
  return {
    text: raw,
    empty: t.trim() === '',
    cues,
    counts,
    category,
    categoryLabel: cfg.engine.categories[category].label,
    categoryScores,
    amount: extractAmount(raw),
    urls: extractUrls(raw),
    signals,
  };
}

// ---------------------------------------------------------------- URL analysis (simulated, offline)
const URL_ERROR = 'Enter a valid URL.';

export function levelFor(score, cfg) {
  for (const l of cfg.engine.levels) if (score >= l.min && score <= l.max) return l;
  return cfg.engine.levels[cfg.engine.levels.length - 1];
}

function invalidUrl(input) {
  return { input, valid: false, error: URL_ERROR, normalized: '', scheme: '', host: '', path: '', registeredDomain: '', tld: '', reputation: 'unknown', reputationNote: '', checks: [], score: 0, level: 'LOW', levelLabel: 'LOW RISK' };
}

export function analyzeUrl(rawInput, cfg) {
  const rules = cfg.urlRules;
  const P = rules.points;
  const input = (rawInput ?? '').trim();
  if (input === '') return invalidUrl(input);
  let s = input;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = 'https://' + s;
  const m = /^(https?):\/\/([^/?#\s]+)([^?#\s]*)(\?[^#\s]*)?(#\S*)?$/i.exec(s);
  if (!m) return invalidUrl(input);
  const scheme = m[1].toLowerCase();
  let authority = m[2].toLowerCase();
  const hasAt = authority.includes('@');
  if (hasAt) authority = authority.slice(authority.lastIndexOf('@') + 1);
  const host = authority.replace(/:\d+$/, '');
  if (!/^[a-z0-9.-]+$/.test(host) || !host.includes('.') || host.startsWith('.') || host.endsWith('.') || host.includes('..')) return invalidUrl(input);
  const path = m[3] ?? '';
  const query = m[4] ?? '';
  const labels = host.split('.');
  const tld = labels[labels.length - 1];
  const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
  const registered = isIp ? host : labels.slice(-2).join('.');
  const official = rules.officialDomains.includes(host) || rules.officialDomains.includes(registered);
  const rep = rules.reputation[host] ?? rules.reputation[registered] ?? null;
  const checks = [];
  const add = (id, label, points, detail) => checks.push({ id, label, points, detail });

  if (rep && rep.status === 'trusted') add('reputation', 'Trusted domain (demo allowlist)', P.trusted, rep.note);
  if (rep && rep.status === 'reported') add('reputation', 'Reported in threat feed (simulated)', P.reported, rep.note);
  if (rep && rep.status === 'new') add('reputation', 'Newly observed domain (simulated)', P.new, rep.note);
  if (scheme === 'http') add('http', 'No HTTPS', P.http, 'The link does not use an encrypted connection.');
  if (isIp) add('ipHost', 'IP address instead of a name', P.ipHost, 'Genuine payment pages use a named domain.');
  if (host.includes('xn--')) add('punycode', 'Look-alike characters (punycode)', P.punycode, 'The domain uses encoded characters that can imitate a real brand.');
  if (hasAt) add('atSign', "'@' hides the real destination", P.atSign, "Everything before '@' is ignored by the browser.");
  if (rules.shorteners.includes(registered)) add('shortener', 'URL shortener', P.shortener, 'A shortener hides where the link really goes.');
  if (!isIp && labels.length - 2 >= 2) add('subdomains', 'Excessive subdomains', P.excessiveSubdomains, 'The domain has ' + (labels.length - 2) + ' subdomain levels.');
  const hyphens = host.split('-').length - 1;
  if (hyphens >= 2) add('hyphens', 'Many hyphens in domain', P.hyphens, 'The domain contains ' + hyphens + ' hyphens, common in look-alike domains.');
  const hostNoTld = labels.slice(0, -1).join('.');
  if (!official) {
    const brand = rules.brandTokens.find((b) => hostNoTld.includes(b));
    if (brand !== undefined) add('brand', 'Brand name on an unofficial domain', P.brandLookalike, "Uses '" + brand + "' but is not an official domain.");
  }
  const hostWords = rules.hostKeywords.filter((k) => hostNoTld.includes(k));
  if (hostWords.length > 0) {
    const n = Math.min(hostWords.length, P.hostKeywordMax);
    add('hostKeywords', 'Bait words in domain', n * P.hostKeywordEach, 'Domain contains: ' + hostWords.slice(0, n).join(', ') + '.');
  }
  const tokens = (path + query).toLowerCase().split(/[^a-z0-9]+/).filter((x) => x !== '');
  const pathWords = rules.pathKeywords.filter((k) => tokens.includes(k));
  if (pathWords.length > 0) {
    const n = Math.min(pathWords.length, P.pathKeywordMax);
    add('pathKeywords', 'Sensitive words in path', n * P.pathKeywordEach, 'Path contains: ' + pathWords.slice(0, n).join(', ') + '.');
  }
  if (rules.suspiciousTlds.includes(tld)) add('tld', 'High-risk top-level domain', P.suspiciousTld, "'." + tld + "' is frequently abused.");
  if (s.length > 75) add('length', 'Very long URL', P.longUrl, 'Long links can hide the real destination.');
  const firstLabel = labels[0];
  const digits = (firstLabel.match(/[0-9]/g) ?? []).length;
  if (!isIp && digits >= 3) add('digits', 'Many digits in domain', P.digitsInName, 'The domain contains ' + digits + ' digits.');

  let sum = 0;
  for (const c of checks) sum += c.points;
  const score = clamp(sum, 0, 100);
  const lvl = levelFor(score, cfg);
  return {
    input, valid: true, error: null,
    normalized: s, scheme, host, path, registeredDomain: registered, tld,
    reputation: rep ? rep.status : 'unknown',
    reputationNote: rep ? rep.note : 'Not present in the simulated reputation database.',
    checks, score, level: lvl.id, levelLabel: lvl.label,
  };
}

// ---------------------------------------------------------------- QR parsing (analysis only — never pays)
const QR_ERROR = 'Unable to read QR. Try again or upload a clearer image.';

export function normalizeSource(v, cfg) {
  const s = (v ?? '').toLowerCase().trim();
  if (s === '') return 'unknown';
  const id = s.replace(/[\s-]+/g, '_');
  if (Object.prototype.hasOwnProperty.call(cfg.engine.sourceTrust, id)) return id;
  if (s.includes('official')) return 'official_app';
  if (s.includes('whatsapp')) return 'whatsapp';
  if (s.includes('sms') || s.includes('text message')) return 'sms';
  if (s.includes('merchant') || s.includes('store')) return 'known_merchant';
  if (s.includes('call') || s.includes('phone')) return 'phone_call';
  if (s.includes('mail')) return 'email';
  if (s.includes('social') || s.includes('instagram') || s.includes('facebook') || s.includes('telegram')) return 'social_media';
  if (s.includes('web') || s.includes('link') || s.includes('browser')) return 'unknown_website';
  return 'unknown';
}

function decodeValue(v) {
  const plus = v.replace(/\+/g, ' ');
  try { return decodeURIComponent(plus); } catch { return plus; }
}
function parseAmount(v) {
  const n = parseFloat(String(v).replace(/[₹,\s]/g, ''));
  return Number.isFinite(n) && n >= 0 ? r2(n) : null;
}
const TRUE_WORDS = ['true', 'yes', '1', 'high'];

export function parseQr(rawInput, cfg) {
  const raw = (rawInput ?? '').trim();
  const res = { raw, format: 'empty', fields: {}, urgentFlag: false, warnings: [], isDemo: false, error: null };
  if (raw === '') { res.error = QR_ERROR; return res; }
  const lower = raw.toLowerCase();
  if (lower.startsWith('payraksha://')) {
    res.format = 'payraksha';
    res.isDemo = true;
    const body = raw.slice('payraksha://'.length);
    const cut = body.search(/[?\r\n]/);
    const params = cut < 0 ? '' : body.slice(cut + 1);
    for (const piece of params.split(/[\r\n&?]+/)) {
      const p = piece.trim();
      const eq = p.indexOf('=');
      if (eq <= 0) continue;
      const key = p.slice(0, eq).trim().toLowerCase();
      const value = decodeValue(p.slice(eq + 1).trim());
      if (key === 'recipient' || key === 'pa') res.fields.recipient = value.toLowerCase();
      else if (key === 'amount' || key === 'am') { const a = parseAmount(value); if (a !== null) res.fields.amount = a; }
      else if (key === 'merchant' || key === 'pn' || key === 'name') res.fields.merchant = value;
      else if (key === 'note' || key === 'tn' || key === 'message') res.fields.note = value;
      else if (key === 'source' || key === 'src' || key === 'channel') { res.fields.source = normalizeSource(value, cfg); res.fields.sourceLabel = value; }
      else if (key === 'scenario') res.fields.scenario = value;
      else if (key === 'urgency' || key === 'urgent') res.urgentFlag = TRUE_WORDS.includes(value.toLowerCase());
      else if (key === 'recipientverified' || key === 'verified') {
        if (TRUE_WORDS.includes(value.toLowerCase())) res.warnings.push('The QR claims its recipient is verified. PAYRAKSHA ignores self-asserted verification.');
      }
    }
    res.warnings.unshift('Demo payment QR — simulation only. Scanning never sends money.');
  } else if (lower.startsWith('upi://')) {
    res.format = 'upi';
    const q = raw.indexOf('?');
    const params = q < 0 ? '' : raw.slice(q + 1);
    for (const piece of params.split('&')) {
      const eq = piece.indexOf('=');
      if (eq <= 0) continue;
      const key = piece.slice(0, eq).trim().toLowerCase();
      const value = decodeValue(piece.slice(eq + 1).trim());
      if (key === 'pa') res.fields.recipient = value.toLowerCase();
      else if (key === 'pn') res.fields.merchant = value;
      else if (key === 'am') { const a = parseAmount(value); if (a !== null) res.fields.amount = a; }
      else if (key === 'tn') res.fields.note = value;
    }
    res.warnings.push('Real UPI payment QR detected. PAYRAKSHA only analyses it and never initiates a payment.');
  } else if (lower.startsWith('http://') || lower.startsWith('https://')) {
    res.format = 'url';
    res.fields.url = raw;
    res.warnings.push('This QR opens a web link instead of a payment request.');
  } else {
    res.format = 'text';
    res.fields.note = raw;
  }
  return res;
}

// ---------------------------------------------------------------- payment context resolution
export function resolvePayment(input, text, qr, url, cfg) {
  const p = input.payment ?? {};
  const f = qr ? qr.fields : {};
  const recipient = (p.recipient ?? f.recipient ?? null);
  const dir = recipient !== null ? (cfg.recipients[recipient] ?? null) : null;
  const amount = p.amount ?? f.amount ?? text.amount ?? null;
  const merchant = p.merchant ?? f.merchant ?? null;
  const source = p.source ?? f.source ?? 'unknown';
  const category = text.category !== 'unknown' ? text.category : (dir ? dir.category : 'unknown');
  const cat = cfg.engine.categories[category];
  const viaQr = qr !== null && (qr.format === 'payraksha' || qr.format === 'upi');
  const hasPaymentRequest = p.hasPaymentRequest ?? (text.counts.paymentRequest > 0 || amount !== null || viaQr);
  return {
    recipient,
    recipientName: dir ? dir.name : null,
    inDirectory: dir !== null,
    recipientChecked: p.recipientChecked ?? true,
    recipientVerified: p.recipientVerified ?? (dir ? dir.verified : false),
    previousPayments: p.previousPayments ?? (dir ? dir.previousPayments : 0),
    amount: amount === null ? null : r2(amount),
    typicalAmount: p.typicalAmount ?? (dir ? dir.typicalAmount : cat.typicalAmount),
    amountUnusual: p.amountUnusual ?? null,
    merchant,
    source,
    sourceLabel: cfg.engine.sourceLabels[source],
    sourceTrust: cfg.engine.sourceTrust[source],
    category,
    categoryLabel: cat.label,
    urgencyLevel: p.urgency ?? null,
    hasPaymentRequest,
    viaQr,
    url: url ? url.input : null,
  };
}

// ---------------------------------------------------------------- features (all values in 0..1, 2 decimals)
export function computeFeatures(ctx, cfg) {
  const { text, qr, url, pay, behaviour } = ctx;
  const K = cfg.engine.params;
  const cat = cfg.engine.categories[pay.category];
  const claim = cat.claim;
  const verified = pay.recipientChecked && pay.recipientVerified;
  const F = {};
  const D = {};

  // recipientNovelty
  if (pay.recipient === null) {
    F.recipientNovelty = pay.hasPaymentRequest ? K.noveltyUnchecked : 0;
    D.recipientNovelty = pay.hasPaymentRequest ? 'The payment request does not name a recipient that can be verified.' : 'No recipient identified.';
  }
  else if (!pay.recipientChecked) { F.recipientNovelty = K.noveltyUnchecked; D.recipientNovelty = 'Recipient ' + pay.recipient + ' has not been checked yet.'; }
  else {
    const n = pay.previousPayments;
    let v = n === 0 ? K.noveltyNever : n <= K.noveltyFewMax ? K.noveltyFew : 0;
    let d = n === 0 ? 'You have never paid ' + pay.recipient + ' before.'
      : n === 1 ? 'Only 1 previous payment to ' + pay.recipient + '.'
      : n <= K.noveltyFewMax ? 'Only ' + n + ' previous payments to ' + pay.recipient + '.'
      : n + ' previous payments to ' + pay.recipient + '.';
    if (verified) { v = v * K.noveltyVerifiedFactor; d += ' The recipient is verified.'; }
    F.recipientNovelty = r2(v); D.recipientNovelty = d;
  }

  // urgency
  const urgencyCues = text.cues.urgency.slice();
  if (qr && qr.urgentFlag) urgencyCues.push('QR marked urgent');
  if (pay.urgencyLevel !== null) {
    F.urgency = cfg.engine.urgencyLevels[pay.urgencyLevel];
    D.urgency = 'Urgency set to ' + pay.urgencyLevel + '.';
  } else if (urgencyCues.length > 0) {
    F.urgency = r2(Math.min(1, K.urgencyPerCue * urgencyCues.length));
    D.urgency = 'Pressure to act fast: ' + urgencyCues.join(', ') + '.';
  } else { F.urgency = 0; D.urgency = 'No urgency language detected.'; }

  // impersonation
  // A claimed organisation is suspicious when the payee is unverified; once the payee is
  // verified, only the channel can still betray an impersonator (official app => 0).
  const authority = text.cues.authority;
  const claimStrength = Math.min(1, K.authorityPerCue * authority.length + (cat.org ? K.impersonationUnverifiedBonus : 0));
  if (authority.length === 0) { F.impersonation = 0; D.impersonation = 'No organisation is being claimed.'; }
  else if (verified) {
    F.impersonation = r2(claimStrength * K.impersonationVerifiedFactor * (1 - pay.sourceTrust));
    D.impersonation = F.impersonation > 0
      ? 'Claims to be ' + claim + '; the payee is verified but the request came via ' + pay.sourceLabel + '.'
      : 'Claims to be ' + claim + ' and the payee is a verified account.';
  } else {
    F.impersonation = r2(claimStrength);
    D.impersonation = 'Claims to be ' + claim + ' (' + authority.join(', ') + ') but the payee is not a verified account.';
  }

  // amountAnomaly
  if (pay.amount === null) { F.amountAnomaly = 0; D.amountAnomaly = 'No amount specified.'; }
  else if (pay.amountUnusual === true) { F.amountAnomaly = K.amountUnusualOverride; D.amountAnomaly = fmtINR(pay.amount) + ' is flagged as unusual for you.'; }
  else if (pay.amountUnusual === false) { F.amountAnomaly = 0; D.amountAnomaly = fmtINR(pay.amount) + ' is marked as a usual amount.'; }
  else {
    const ratio = pay.amount / Math.max(1, pay.typicalAmount);
    const v = ratio <= K.amountRatioStart ? 0 : Math.min(1, (ratio - K.amountRatioStart) / K.amountRatioSpan);
    F.amountAnomaly = r2(v);
    D.amountAnomaly = v === 0 ? fmtINR(pay.amount) + ' is within your usual range.'
      : fmtINR(pay.amount) + ' is ' + fmtNum(r1(ratio)) + 'x your typical ' + fmtINR(pay.typicalAmount) + ' payment.';
  }

  // suspiciousURL
  if (!url) { F.suspiciousURL = 0; D.suspiciousURL = 'No link involved.'; }
  else if (!url.valid) { F.suspiciousURL = 0; D.suspiciousURL = 'The link could not be parsed.'; }
  else if (K.urlIgnoredForOfficialApp && pay.source === 'official_app') { F.suspiciousURL = 0; D.suspiciousURL = 'Paying inside the official app, so the link is not in the payment path.'; }
  else { F.suspiciousURL = r2(url.score / 100); D.suspiciousURL = url.host + ' scored ' + url.score + '/100 in link checks.'; }

  // qrRedirection
  if (!pay.viaQr) { F.qrRedirection = 0; D.qrRedirection = 'No payment QR involved.'; }
  else if (verified) { F.qrRedirection = 0; D.qrRedirection = 'The QR pays a verified account.'; }
  else {
    F.qrRedirection = r2(Math.min(1, (pay.merchant !== null ? K.qrMerchantClaimed : K.qrNoMerchant) + (1 - pay.sourceTrust) * K.qrSourceFactor));
    D.qrRedirection = pay.merchant !== null
      ? "The QR shows '" + pay.merchant + "' but pays an unverified account (" + (pay.recipient ?? 'unknown') + ').'
      : 'The QR pays an unverified account (' + (pay.recipient ?? 'unknown') + ').';
  }

  // socialEngineering
  const seCues = [...text.cues.threat, ...text.cues.lure, ...text.cues.secrecy, ...text.cues.credential];
  F.socialEngineering = r2(Math.min(1,
    K.seThreat * text.counts.threat + K.seLure * text.counts.lure + K.seSecrecy * text.counts.secrecy + K.seCredential * text.counts.credential));
  D.socialEngineering = seCues.length > 0 ? 'Manipulation cues: ' + seCues.join(', ') + '.' : 'No pressure, lure or secrecy tactics detected.';

  // contextMismatch
  let ctxV = 0;
  const parts = [];
  if (cat.org && cfg.engine.personalChannels.includes(pay.source)) {
    ctxV += K.ctxOrgViaPersonal;
    parts.push(capitalize(claim) + ' does not normally contact you via ' + pay.sourceLabel + '.');
  }
  if (cat.neverCollects && pay.hasPaymentRequest) {
    ctxV += K.ctxNeverCollects;
    parts.push('Genuine ' + cat.label + ' processes do not ask you to pay.');
  }
  if (pay.hasPaymentRequest && pay.recipient !== null && !verified && (pay.merchant !== null || cat.org)) {
    ctxV += K.ctxClaimedUnverified;
    parts.push('The payee does not match the claimed ' + (pay.merchant !== null ? "merchant '" + pay.merchant + "'." : 'organisation.'));
  }
  F.contextMismatch = r2(Math.min(1, ctxV));
  D.contextMismatch = parts.length > 0 ? parts.join(' ') : 'The payment context is consistent.';

  // behaviouralAnomaly
  const B = K.behaviour;
  const bFlags = [];
  let bV = 0;
  const bNames = { onCall: 'on a phone call', screenShare: 'screen sharing active', newDevice: 'new device', lateNight: 'late-night payment', rapidAttempts: 'repeated payment attempts' };
  for (const k of ['onCall', 'screenShare', 'newDevice', 'lateNight', 'rapidAttempts']) {
    if (behaviour && behaviour[k] === true) { bV += B[k]; bFlags.push(bNames[k]); }
  }
  F.behaviouralAnomaly = r2(Math.min(1, bV));
  D.behaviouralAnomaly = bFlags.length > 0 ? 'Session risk: ' + bFlags.join(', ') + '.' : 'No unusual session behaviour.';

  // untrustedSource
  F.untrustedSource = r2(1 - pay.sourceTrust);
  D.untrustedSource = 'Request arrived via ' + pay.sourceLabel + ' (source trust ' + pct(pay.sourceTrust) + '%).';

  return { values: F, details: D };
}

// ---------------------------------------------------------------- combos, scoring, patterns
function condHolds(c, F) { return F[c.feature] >= c.min; }

export function matchCombos(F, pay, cfg) {
  const verified = pay.recipientChecked && pay.recipientVerified;
  const out = [];
  for (const c of cfg.patterns.combos) {
    if (!c.all.every((x) => condHolds(x, F))) continue;
    if (c.category !== undefined && c.category !== pay.category) continue;
    if (c.paymentRequest === true && !pay.hasPaymentRequest) continue;
    if (c.recipientUnverified === true && verified) continue;
    if (c.viaQr === true && !pay.viaQr) continue;
    out.push(c);
  }
  return out;
}

export function scoreFeatures(F, D, combos, cfg) {
  const E = cfg.engine;
  const contributions = [{ key: 'baseline', label: 'Baseline residual risk', kind: 'baseline', value: 1, weight: E.baseline, points: E.baseline, severity: 'none', detail: 'Every payment carries a small residual risk.' }];
  for (const k of FACTOR_KEYS) {
    const pts = pointsFor(E.weights[k], F[k]);
    if (pts === 0) continue;
    contributions.push({ key: k, label: E.factorLabels[k], kind: 'factor', value: F[k], weight: E.weights[k], points: pts, severity: severityOf(F[k], E.thresholds), detail: D[k] });
  }
  for (const c of combos) {
    contributions.push({ key: 'combo:' + c.id, label: 'Signals connected: ' + c.name, kind: 'combo', value: 1, weight: c.points, points: c.points, severity: 'high', detail: 'These signals appeared together, a known scam combination.' });
  }
  let sum = 0;
  for (const c of contributions) sum += c.points;
  const score = clamp(sum, 0, 100);
  return { contributions, score, clamped: score !== sum };
}

export function detectPatterns(F, pay, score, combos, cfg) {
  const P = cfg.patterns;
  const patterns = [];
  let primary = null;
  if (score >= P.minScoreForPattern) {
    for (const p of P.primary) {
      if (p.category === pay.category && p.anyOf.some((x) => condHolds(x, F))) { primary = p; break; }
    }
  }
  const mods = score >= P.minScoreForPattern ? P.modifiers.filter((m) => F[m.feature] >= m.min).slice(0, P.maxModifiers) : [];
  if (primary) patterns.push({ id: primary.id, name: primary.name, kind: 'primary' });
  for (const m of mods) patterns.push({ id: m.id, name: m.name, kind: 'modifier' });
  for (const c of combos) patterns.push({ id: c.id, name: c.name, kind: 'combo' });
  let patternName;
  if (score < P.minScoreForPattern) patternName = P.noPatternName;
  else if (primary) patternName = [primary.name, ...mods.map((m) => m.name)].join(' + ');
  else if (mods.length > 0) patternName = mods.map((m) => m.name).join(' + ');
  else patternName = P.genericPatternName;
  return { patterns, patternName };
}

// ---------------------------------------------------------------- explainability
const PHRASES = [
  ['recipientNovelty', 'an unfamiliar recipient'],
  ['urgency', 'urgent language'],
  ['context', 'a payment context inconsistent with the claimed organization'],
  ['suspiciousURL', 'a suspicious link'],
  ['qrRedirection', 'a QR code that redirects to an unverified account'],
  ['amountAnomaly', 'an unusual amount'],
  ['socialEngineering', 'pressure or lure tactics'],
  ['behaviouralAnomaly', 'a risky session such as an ongoing call'],
  ['untrustedSource', 'a low-trust channel'],
];
const HEADLINES = {
  HIGH: 'Multiple warning signals detected',
  HIGH_CAUTION: 'Potentially risky payment situation',
  CAUTION: 'Some warning signals detected',
  LOW: 'No significant warning signals detected',
};

export function trustSignalsFor(F, pay, url, text) {
  const out = [];
  if (pay.recipient !== null && pay.recipientChecked && pay.previousPayments >= 3) out.push('Familiar recipient');
  if (pay.recipient !== null && pay.recipientChecked && pay.recipientVerified) out.push('Verified recipient');
  if (pay.amount !== null && F.amountAnomaly === 0) out.push('Normal payment range');
  if (pay.source === 'official_app') out.push('Official demo source');
  else if (pay.sourceTrust >= 0.8) out.push('Trusted source (' + pay.sourceLabel + ')');
  if (F.urgency === 0) out.push('No urgency');
  if (url && url.valid && url.reputation === 'trusted') out.push('Link is on the demo allowlist');
  if (F.contextMismatch === 0 && F.impersonation === 0 && F.socialEngineering === 0 && F.suspiciousURL < 0.3 && F.behaviouralAnomaly === 0 && F.qrRedirection === 0) out.push('No suspicious context detected');
  return out;
}

export function buildExplanation(F, contributions, level, pay, url, text) {
  const trustSignals = trustSignalsFor(F, pay, url, text);
  let summary;
  if (level === 'LOW') {
    const parts = [];
    if (trustSignals.includes('Familiar recipient') || trustSignals.includes('Verified recipient')) parts.push('familiar recipient');
    if (trustSignals.includes('Normal payment range')) parts.push('normal amount');
    if (pay.source === 'official_app') parts.push('official demo source');
    else if (pay.sourceTrust >= 0.8) parts.push('trusted source');
    summary = parts.length > 0
      ? capitalize(parts.join(', ')) + ', and no significant suspicious context detected.'
      : 'No significant suspicious context detected.';
  } else {
    const chosen = [];
    for (const [key, phrase] of PHRASES) {
      const v = key === 'context' ? Math.max(F.contextMismatch, F.impersonation) : F[key];
      if (v >= 0.4) chosen.push(phrase);
      if (chosen.length === 3) break;
    }
    summary = chosen.length > 0
      ? 'The payment request is associated with ' + joinList(chosen) + '.'
      : 'Several weaker warning signals appeared together.';
  }
  const ranked = contributions.filter((c) => c.kind !== 'baseline').slice().sort((a, b) => b.points - a.points);
  const reasons = ranked.map((c) => c.detail + ' (+' + c.points + ')');
  return { headline: HEADLINES[level], summary, reasons, trustSignals, disclaimer: DISCLAIMER };
}

const ACTIONS = {
  verify: 'VERIFY OFFICIALLY', cancel: 'CANCEL', trusted: 'ASK TRUSTED CONTACT', analysis: 'VIEW FULL ANALYSIS', continue: 'CONTINUE (SIMULATION)',
};
const RECOMMENDATIONS = {
  HIGH: { verdict: 'DONT_PAY_YET', title: "DON'T PAY YET", message: 'Multiple warning signals detected. Pause and verify through official channels before paying.', actions: ['verify', 'cancel', 'trusted', 'analysis'] },
  HIGH_CAUTION: { verdict: 'VERIFY_FIRST', title: 'VERIFY BEFORE PAYING', message: 'This payment looks potentially risky. Confirm the recipient through an official channel first.', actions: ['verify', 'trusted', 'cancel', 'analysis'] },
  CAUTION: { verdict: 'PROCEED_WITH_CARE', title: 'PROCEED WITH CARE', message: 'Some warning signals were found. Double-check the recipient and amount before paying.', actions: ['verify', 'analysis', 'cancel'] },
  LOW: { verdict: 'LOOKS_SAFE', title: 'LOW RISK', message: 'No significant warning signals detected. Keep paying only inside official apps.', actions: ['continue', 'analysis'] },
};
export function buildRecommendation(level) {
  const r = RECOMMENDATIONS[level];
  return { verdict: r.verdict, title: r.title, message: r.message, actions: r.actions.map((id) => ({ id, label: ACTIONS[id] })) };
}

export function buildAttackChain(F, pay, url, text, score, lvl, cfg) {
  const T = cfg.engine.thresholds;
  const sev = (v) => severityOf(v, T);
  const verdictSev = lvl.id === 'HIGH' || lvl.id === 'HIGH_CAUTION' ? 'high' : lvl.id === 'CAUTION' ? 'medium' : 'low';
  const msgV = Math.max(F.urgency, F.impersonation, F.socialEngineering);
  const nodes = [
    { id: 'message', icon: '📱', label: 'Message', active: !text.empty, detail: text.empty ? 'No message' : (msgV >= 0.4 ? 'Suspicious message received' : 'Message received'), severity: !text.empty ? sev(msgV) : 'none' },
    { id: 'urgency', icon: '⚠️', label: 'Urgency', active: F.urgency > 0, detail: F.urgency > 0 ? 'Pressure to act fast' : 'No urgency', severity: sev(F.urgency) },
    { id: 'url', icon: '🌐', label: 'Suspicious URL', active: F.suspiciousURL >= 0.3, detail: url && url.valid ? url.host + ' (' + url.score + '/100)' : 'No link', severity: sev(F.suspiciousURL) },
    { id: 'qr', icon: '📷', label: 'QR Code', active: pay.viaQr, detail: pay.viaQr ? (pay.merchant ?? pay.recipient ?? 'Payment QR') : 'No QR', severity: pay.viaQr ? sev(F.qrRedirection) : 'none' },
    { id: 'recipient', icon: '👤', label: 'Unknown Recipient', active: F.recipientNovelty >= 0.5, detail: pay.recipient ?? 'No recipient', severity: sev(F.recipientNovelty) },
    { id: 'payment', icon: '💰', label: 'Payment Request', active: pay.hasPaymentRequest, detail: pay.amount !== null ? fmtINR(pay.amount) : 'Payment requested', severity: pay.hasPaymentRequest ? sev(Math.max(F.amountAnomaly, F.contextMismatch)) : 'none' },
    { id: 'verdict', icon: lvl.id === 'LOW' ? '✅' : lvl.id === 'CAUTION' ? '⚠️' : '🚨', label: lvl.label, active: true, detail: score + '/100', severity: verdictSev },
  ];
  return nodes;
}

// ---------------------------------------------------------------- pipeline
function cleanInput(input) {
  const out = {};
  for (const k of ['message', 'url', 'qrText', 'scenarioId']) {
    if (typeof input[k] === 'string' && input[k].trim() !== '') out[k] = input[k];
  }
  if (input.payment && Object.keys(input.payment).length > 0) out.payment = { ...input.payment };
  if (input.behaviour && Object.keys(input.behaviour).length > 0) out.behaviour = { ...input.behaviour };
  return out;
}

export function analyze(rawInput, cfg, runtime = 'reference') {
  const input = cleanInput(rawInput ?? {});
  const qr = input.qrText !== undefined ? parseQr(input.qrText, cfg) : null;
  const combinedText = [input.message ?? '', qr && qr.fields.merchant ? qr.fields.merchant : '', qr && qr.fields.note ? qr.fields.note : ''].filter((x) => x !== '').join('\n');
  const text = analyzeText(combinedText, cfg);
  const messageUrls = extractUrls(input.message ?? '');
  const urlInput = input.url ?? (messageUrls.length > 0 ? messageUrls[0] : (qr && qr.format === 'url' ? qr.fields.url : null));
  const url = urlInput !== null && urlInput !== undefined ? analyzeUrl(urlInput, cfg) : null;
  const pay = resolvePayment(input, text, qr, url, cfg);
  const { values: F, details: D } = computeFeatures({ text, qr, url, pay, behaviour: input.behaviour ?? {} }, cfg);
  const combos = matchCombos(F, pay, cfg);
  const { contributions, score, clamped } = scoreFeatures(F, D, combos, cfg);
  const lvl = levelFor(score, cfg);
  const { patterns, patternName } = detectPatterns(F, pay, score, combos, cfg);
  const T = cfg.engine.thresholds;
  const dna = DNA_KEYS.map((k) => {
    const c = contributions.find((x) => x.key === k);
    return { key: k, label: DNA_LABELS[k], value: F[k], percent: pct(F[k]), severity: severityOf(F[k], T), points: c ? c.points : 0 };
  });
  const features = { ...F, recipientVerified: pay.recipientChecked && pay.recipientVerified ? 1 : 0, sourceTrust: pay.sourceTrust };
  return {
    id: reportId(input, score),
    simulation: true,
    notice: SIMULATION_NOTICE,
    engine: { name: cfg.engine.engineName, version: cfg.engine.version, runtime },
    input,
    analyses: { text, url, qr },
    payment: pay,
    features,
    featureDetails: D,
    contributions,
    score,
    clamped,
    level: lvl.id,
    levelLabel: lvl.label,
    dna,
    patterns,
    patternName,
    attackChain: buildAttackChain(F, pay, url, text, score, lvl, cfg),
    explanation: buildExplanation(F, contributions, lvl.id, pay, url, text),
    recommendation: buildRecommendation(lvl.id),
  };
}

// Deep-merges a sequence patch into an input (payment/behaviour merged, other keys replaced).
export function applyPatch(input, patch) {
  const out = { ...input };
  for (const [k, v] of Object.entries(patch ?? {})) {
    if ((k === 'payment' || k === 'behaviour') && v && typeof v === 'object') out[k] = { ...(input[k] ?? {}), ...v };
    else out[k] = v;
  }
  return out;
}

export function scenarioInput(s) {
  const input = { scenarioId: s.id };
  if (s.message) input.message = s.message;
  if (s.url) input.url = s.url;
  if (s.qrText) input.qrText = s.qrText;
  if (s.payment && Object.keys(s.payment).length) input.payment = { ...s.payment };
  if (s.behaviour && Object.keys(s.behaviour).length) input.behaviour = { ...s.behaviour };
  return input;
}
