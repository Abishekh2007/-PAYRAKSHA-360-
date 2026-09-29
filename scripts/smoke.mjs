// Smoke test: starts the real backend, checks /api/health and three flagship analyses, and that the
// Python engine's answers equal the reference engine's. Exit 0 = the app's API runs.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { ROOT, findPython } from './lib/python.mjs';
import * as E from '../shared/reference/engine.mjs';
import { loadConfig, loadScenarios } from '../shared/reference/load.mjs';

const PORT = Number(process.env.SMOKE_PORT || 8765);
const BASE = `http://127.0.0.1:${PORT}`;
const py = findPython();
const log = [];
const server = spawn(py.cmd, [...py.args, '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', String(PORT)], {
  cwd: path.join(ROOT, 'backend'),
  stdio: ['ignore', 'pipe', 'pipe'],
});
server.stdout.on('data', (d) => log.push(String(d)));
server.stderr.on('data', (d) => log.push(String(d)));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function fail(msg) {
  console.error('SMOKE FAIL: ' + msg);
  console.error(log.join('').split('\n').slice(-30).join('\n'));
  server.kill();
  process.exit(1);
}
async function call(pathname, body) {
  const init = body === undefined ? {} : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) };
  const res = await fetch(BASE + pathname, init);
  if (!res.ok) fail(`${pathname} returned HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

try {
  let health = null;
  for (let i = 0; i < 80 && !health; i++) {
    try {
      const r = await fetch(BASE + '/api/health');
      if (r.ok) health = await r.json();
    } catch {
      await sleep(500);
    }
  }
  if (!health) fail('backend did not answer /api/health within 40 s');
  if (health.status !== 'ok' || health.simulation !== true) fail('unexpected health payload ' + JSON.stringify(health));
  console.log('ok  health: ' + JSON.stringify(health));

  const cfg = loadConfig();
  const book = loadScenarios();
  const anchors = { utility_scam: [92, 'HIGH'], legit_utility: [12, 'LOW'], customer_care_scam: [88, 'HIGH'] };
  for (const [id, [score, level]] of Object.entries(anchors)) {
    const input = E.scenarioInput(book.scenarios.find((x) => x.id === id));
    const out = await call('/api/analyze', input);
    if (out.score !== score || out.level !== level) fail(`${id}: got ${out.score} ${out.level}, expected ${score} ${level}`);
    if (out.engine?.runtime !== 'python') fail(`${id}: engine.runtime is ${out.engine?.runtime}, expected python`);
    const { ml, ...report } = out;
    if (!isDeepStrictEqual(report, E.analyze(input, cfg, 'python'))) fail(`${id}: the Python report differs from the reference engine`);
    console.log(`ok  ${id}: ${out.score}/100 ${out.level} (python engine${ml && ml.available ? `, ml ${ml.label}` : ''})`);
  }
  const u = 'https://electricity-bill-update.demo/pay-now';
  const url = await call('/api/analyze/url', { url: u });
  if (!isDeepStrictEqual(url, E.analyzeUrl(u, cfg))) fail('url analysis differs from the reference engine');
  console.log(`ok  url: ${url.score}/100 ${url.level}`);
  console.log('SMOKE OK');
  server.kill();
  process.exit(0);
} catch (e) {
  fail(e?.stack || String(e));
}
