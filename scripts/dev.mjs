// Runs the FastAPI backend and the Vite dev server together: `npm run dev:all`, then open http://localhost:5173.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { ROOT } from './lib/python.mjs';

const procs = [
  spawn(process.execPath, [path.join(ROOT, 'scripts', 'backend.mjs')], { cwd: ROOT, stdio: 'inherit' }),
  spawn(process.execPath, [path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js')], { cwd: ROOT, stdio: 'inherit' }),
];
let stopping = false;
const stop = () => {
  if (stopping) return;
  stopping = true;
  for (const p of procs) p.kill();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
for (const p of procs) p.on('exit', stop);
