// build-exe.mjs — produces release/PAYRAKSHA360.exe
// Usage: node scripts/build-exe.mjs [--skip-web]
import { spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { ROOT, findPython } from './lib/python.mjs';

const skipWeb = process.argv.includes('--skip-web');

// ── 1. Web build ─────────────────────────────────────────────────────────────
if (!skipWeb) {
  console.log('Building frontend (npm run build)...');
  const r = spawnSync('npm', ['run', 'build'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (r.error) { console.error('npm run build failed:', r.error.message); process.exit(1); }
  if (r.status !== 0) { console.error('npm run build exited with status', r.status); process.exit(1); }
}

if (!existsSync(path.join(ROOT, 'dist', 'index.html'))) {
  console.error('dist/index.html is missing after build. The web build must have failed.');
  process.exit(1);
}

if (!existsSync(path.join(ROOT, "dist-pay", "index.html"))) {
  console.error("dist-pay/index.html is missing after build. The web build must have failed.");
  process.exit(1);
}

// ── 2. Locate Python / check PyInstaller ────────────────────────────────────
const py = findPython();
const piCheck = spawnSync(py.cmd, [...py.args, '-m', 'PyInstaller', '--version'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
});
if (piCheck.status !== 0) {
  const pythonStr = [py.cmd, ...py.args].join(' ');
  console.error(`PyInstaller is missing. Install it with: "${pythonStr}" -m pip install pyinstaller`);
  process.exit(1);
}
console.log('PyInstaller version:', piCheck.stdout.trim());

// ── 3. Collect runtime JSON files ────────────────────────────────────────────
const sharedJsons = [
  'engine-config.json',
  'lexicon.json',
  'url-rules.json',
  'recipients.json',
  'patterns.json',
  'scenarios.json',
];
const sep = path.delimiter; // ';' on Windows

const addDataArgs = [
  `${path.join(ROOT, 'dist')}${sep}dist`,
  `${path.join(ROOT, 'dist-pay')}${sep}dist-pay`,
  `${path.join(ROOT, 'dist-auditor')}${sep}dist-auditor`,
  ...sharedJsons.map(f => `${path.join(ROOT, 'shared', f)}${sep}shared`),
].flatMap(d => ['--add-data', d]);

// ── 4. Run PyInstaller ───────────────────────────────────────────────────────
const pyiArgs = [
  ...py.args,
  '-m', 'PyInstaller',
  '--noconfirm',
  '--clean',
  '--onefile',
  '--console',
  '--name', 'PAYRAKSHA360',
  '--icon', path.join(ROOT, 'packaging', 'payraksha.ico'),
  '--paths', path.join(ROOT, 'backend'),
  ...addDataArgs,
  '--collect-submodules', 'uvicorn',
  '--collect-submodules', 'app',
  '--hidden-import', 'app.main',
  '--collect-submodules', 'sqlalchemy',
  '--hidden-import', 'sqlalchemy.dialects.sqlite',
  '--hidden-import', 'sqlalchemy.dialects.postgresql.psycopg',
  '--collect-submodules', 'psycopg',
  '--hidden-import', 'app.config',
  '--hidden-import', 'app.engine',
  '--hidden-import', 'app.ml',
  '--hidden-import', 'sklearn.feature_extraction.text',
  '--hidden-import', 'sklearn.linear_model',
  '--hidden-import', 'sklearn.utils._weight_vector',
  '--hidden-import', 'numpy',
  '--hidden-import', 'scipy.sparse',
  '--hidden-import', 'scipy.sparse._csr',
  '--collect-submodules', 'sklearn',
  '--collect-submodules', 'scipy',
  '--collect-submodules', 'numpy',
  '--exclude-module', 'pytest',
  '--exclude-module', 'tkinter',
  '--exclude-module', 'matplotlib',
  '--exclude-module', 'IPython',
  '--exclude-module', 'PIL',
  '--distpath', path.join(ROOT, 'release'),
  '--workpath', path.join(ROOT, '.pyinstaller', 'build'),
  '--specpath', path.join(ROOT, '.pyinstaller'),
  path.join(ROOT, 'packaging', 'launcher.py'),
];

console.log('Running PyInstaller...');
const piRun = spawnSync(py.cmd, pyiArgs, {
  cwd: ROOT,
  stdio: 'inherit',
  // No shell: paths may contain spaces; spawnSync handles quoting for us
});
if (piRun.error) { console.error('PyInstaller failed:', piRun.error.message); process.exit(1); }
if (piRun.status !== 0) { console.error('PyInstaller exited with status', piRun.status); process.exit(1); }

// ── 5. Report ────────────────────────────────────────────────────────────────
const exePath = path.join(ROOT, 'release', 'PAYRAKSHA360.exe');
if (!existsSync(exePath)) {
  console.error('PyInstaller succeeded but release/PAYRAKSHA360.exe not found!');
  process.exit(1);
}
const mb = (statSync(exePath).size / 1024 / 1024).toFixed(1);
console.log(`Built release/PAYRAKSHA360.exe (${mb} MB)`);
