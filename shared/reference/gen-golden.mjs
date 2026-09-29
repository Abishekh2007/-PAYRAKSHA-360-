// Regenerates shared/golden/golden.json from the reference engine: `node shared/reference/gen-golden.mjs`.
// Ports (backend/app/engine.py) must reproduce every `expected` exactly, ignoring engine.runtime.
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as E from './engine.mjs';
import { loadConfig, loadScenarios } from './load.mjs';

const cfg = loadConfig();
const S = loadScenarios();
const byId = Object.fromEntries(S.scenarios.map((s) => [s.id, s]));
const cases = [];
const add = (kind, name, input) => {
  let expected;
  if (kind === 'analyze') expected = E.analyze(input, cfg, 'reference');
  else if (kind === 'analyzeText') expected = E.analyzeText(input, cfg);
  else if (kind === 'analyzeUrl') expected = E.analyzeUrl(input, cfg);
  else if (kind === 'parseQr') expected = E.parseQr(input, cfg);
  else if (kind === 'fmtINR') expected = E.fmtINR(input);
  else if (kind === 'fnv1a') expected = E.fnv1a(input);
  cases.push({ kind, name, input, expected });
};

for (const s of S.scenarios) {
  const inp = E.scenarioInput(s);
  add('analyze', 'scenario:' + s.id, inp);
  if (s.message) add('analyze', 'message-only:' + s.id, { message: s.message });
  add('analyze', 'qr-only:' + s.id, { qrText: s.qrText });
}
const seq = S.sequences;
let inp = E.scenarioInput(byId[seq.counterfactual.baseScenario]);
for (const st of seq.counterfactual.steps) { inp = E.applyPatch(inp, st.patch); add('analyze', 'counterfactual:' + st.id, inp); }
for (const st of seq.whatIf.controls.slice(3)) { inp = E.applyPatch(inp, st.patch); add('analyze', 'whatIf:' + st.id, inp); }
inp = { ...seq.signalsConnected.base };
for (const st of seq.signalsConnected.steps) { inp = E.applyPatch(inp, st.patch); add('analyze', 'signals:' + st.id, inp); }
const base = E.scenarioInput(byId[seq.liveSimulation.baseScenario]);
for (const [name, st] of Object.entries(seq.liveSimulation.stages)) {
  let i = {};
  for (const f of st.fields) if (base[f] !== undefined) i[f] = base[f];
  if (st.payment) i = E.applyPatch(i, { payment: st.payment });
  add('analyze', 'live:' + name, i);
}
// Edge cases
add('analyze', 'edge:empty', {});
add('analyze', 'edge:upi', { qrText: 'upi://pay?pa=someone@okdemo&pn=Some%20Shop&am=250.50&tn=Order%2012' });
add('analyze', 'edge:behaviour', { ...E.scenarioInput(byId.legit_merchant), behaviour: { onCall: true, screenShare: true, newDevice: true } });
add('analyze', 'edge:overrides', { message: 'Pay rs. 2,00,000 to complete the order', payment: { recipient: 'friend-ravi@demo', amountUnusual: true, urgency: 'medium', source: 'unknown_website' } });
add('analyze', 'edge:amount-false', { qrText: byId.shopping_scam.qrText, payment: { amountUnusual: false, hasPaymentRequest: false } });
add('analyze', 'edge:url-in-message', { message: 'Your KYC is pending, update at http://192.168.10.5/kyc/update?otp=1 right now or account will be frozen' });
add('analyze', 'edge:text-qr', { qrText: 'Hello, this QR has plain text only' });
add('analyze', 'edge:url-qr', { qrText: 'https://lucky-draw-winner.demo/claim' });
add('analyze', 'edge:curly', { message: 'Don’t share this OTP. Customer care will call you tonight, INR 5000 refund pending' });
for (const u of ['', 'not a url', 'https://official-demo-bank.example/login', 'secure-bank-kyc-demo.example', 'https://electricity-bill-update.demo/pay-now',
  'https://example-shopping-offer.demo/iphone-deal', 'http://192.168.1.10/login', 'https://bit.ly/3xYz', 'https://xn--bnk-sbi-9za.com/kyc',
  'https://user@evil-login.xyz/pay', 'https://a.b.c.verify-login-account.top/verify/otp/pin?x=1', 'https://www.merchant-store.demo/checkout',
  'https://sbi-kyc-update-2024-online.click/update/kyc?session=12345678901234567890&ref=abcdefghijklmnop', 'ftp://files.demo/x', 'https://bad..host/x', 'https://secure-bank-kyc-demo.example:8443/a#frag'])
  add('analyzeUrl', 'url:' + u, u);
for (const t of ['', 'URGENT! Your bank KYC will expire today. Pay ₹10 immediately using this QR to avoid account suspension.', 'Free gift! Your account is frozen.',
  'Pay Rs.1,50,000.50 now via https://pay-now.demo/x). Do not share OTP!', 'hello friend, dinner split is inr 450', 'Congratulations winner! Claim lottery prize, act now'])
  add('analyzeText', 'text:' + t.slice(0, 40), t);
for (const q of ['', 'PAYRAKSHA://demo-payment\nrecipient=Unknown@Demo\namount=1,999\nmerchant=Electricity+Board%20Demo\nsource=Phone Call\nurgency=yes\nverified=true',
  'payraksha://demo-payment?pa=merchant@demo&am=450&pn=Kirana&src=official%20app', 'PAYRAKSHA://demo-payment\nnote=%E0%A4%bad\namount=abc',
  'upi://pay?pa=shop@okdemo&pn=Shop&am=99&tn=Tea', 'https://example-shopping-offer.demo', 'random text'])
  add('parseQr', 'qr:' + q.slice(0, 40), q);
for (const n of [0, 5, 10, 999, 1000, 1999, 15000, 100000, 1500000, 25000000, 10.5, 1999.99, 0.5]) add('fmtINR', 'inr:' + n, n);
for (const t of ['', 'a', 'PAYRAKSHA', 'URGENT ₹1,999 😀']) add('fnv1a', 'fnv:' + t, t);

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'golden');
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'golden.json'), JSON.stringify({ engineVersion: cfg.engine.version, note: 'Generated by shared/reference/gen-golden.mjs. Compare everything except engine.runtime.', cases }, null, 1) + '\n');
console.log('wrote', cases.length, 'cases');
