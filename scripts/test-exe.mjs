// test-exe.mjs — integration test for release/PAYRAKSHA360.exe
// Usage: node scripts/test-exe.mjs
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT } from './lib/python.mjs';

const EXE = path.join(ROOT, 'release', 'PAYRAKSHA360.exe');
const PORT = 8799;
const BASE = `http://127.0.0.1:${PORT}`;

if (!existsSync(EXE)) {
  console.error('release/PAYRAKSHA360.exe not found. Run: npm run build:exe');
  process.exit(1);
}

// Build scenarioInput from the shared scenarios file (duplicate logic from engine.mjs)
function scenarioInput(s) {
  const input = { scenarioId: s.id };
  if (s.message) input.message = s.message;
  if (s.url) input.url = s.url;
  if (s.qrText) input.qrText = s.qrText;
  if (s.payment && Object.keys(s.payment).length) input.payment = { ...s.payment };
  if (s.behaviour && Object.keys(s.behaviour).length) input.behaviour = { ...s.behaviour };
  return input;
}

const scenariosRaw = JSON.parse(readFileSync(path.join(ROOT, 'shared', 'scenarios.json'), 'utf8'));
const utilityScam = scenariosRaw.scenarios.find(s => s.id === 'utility_scam');
const utilityScamInput = scenarioInput(utilityScam);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function pollHealth(timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${BASE}/api/health`);
      if (r.ok) return await r.json();
    } catch { /* not ready yet */ }
    await sleep(1000);
  }
  return null;
}

async function portFree(timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await fetch(`${BASE}/api/health`);
      await sleep(500);
    } catch {
      return true; // connection refused = port free
    }
  }
  return false;
}

const log = [];
const child = spawn(EXE, ['--no-browser', '--port', String(PORT)], {
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
});
child.stdout.on('data', (d) => { log.push(String(d)); });
child.stderr.on('data', (d) => { log.push(String(d)); });

let exitCode = 0;

try {
  const health = await pollHealth(120_000);
  if (!health) {
    throw new Error(`EXE did not answer ${BASE}/api/health within 120 s`);
  }

  // 1. health
  if (health.status !== 'ok' || health.simulation !== true) {
    throw new Error(`health payload wrong: ${JSON.stringify(health)}`);
  }
  if (!health.ml || health.ml.available !== true) {
    throw new Error(`ml.available is not true in health: ${JSON.stringify(health.ml)}`);
  }
  console.log(`ok  health: status=${health.status} simulation=${health.simulation} ml.available=${health.ml.available}`);

  // 2. GET /  → 200, text/html, contains PAYRAKSHA
  const rootRes = await fetch(`${BASE}/`);
  if (rootRes.status !== 200) throw new Error(`GET / returned ${rootRes.status}`);
  const ct = rootRes.headers.get('content-type') || '';
  if (!ct.includes('text/html')) throw new Error(`GET / content-type is '${ct}', expected text/html`);
  const body = await rootRes.text();
  if (!body.includes('PAYRAKSHA')) throw new Error(`GET / body does not contain 'PAYRAKSHA'`);
  console.log(`ok  GET / → 200 text/html (${body.length} bytes)`);

  // 3. GET /models/RobotExpressive.glb → 200
  const glbRes = await fetch(`${BASE}/models/RobotExpressive.glb`);
  if (glbRes.status !== 200) throw new Error(`GET /models/RobotExpressive.glb returned ${glbRes.status}`);
  console.log(`ok  GET /models/RobotExpressive.glb → 200`);

  // 4. POST /api/analyze with utility_scam → score 92, level HIGH
  const analyzeRes = await fetch(`${BASE}/api/analyze`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(utilityScamInput),
  });
  if (!analyzeRes.ok) throw new Error(`POST /api/analyze returned ${analyzeRes.status}: ${await analyzeRes.text()}`);
  const analyzeData = await analyzeRes.json();
  if (analyzeData.score !== 92 || analyzeData.level !== 'HIGH') {
    throw new Error(`utility_scam: got score=${analyzeData.score} level=${analyzeData.level}, expected 92 HIGH`);
  }
  console.log(`ok  POST /api/analyze utility_scam → score=${analyzeData.score} level=${analyzeData.level}`);

  console.log('EXE OK');
} catch (e) {
  exitCode = 1;
  console.error('EXE TEST FAILED:', e.message);
  const output = log.join('');
  const lines = output.split('\n');
  console.error('--- last 40 lines of exe output ---');
  console.error(lines.slice(-40).join('\n'));
} finally {
  // Kill the exe and its child Python process
  try {
    execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } catch { /* already dead */ }
  // Wait until port is free
  const freed = await portFree(10_000);
  if (!freed) console.warn(`WARNING: port ${PORT} still in use after 10 s`);
}

process.exitCode = exitCode;
