// Finds the backend's Python: backend/.venv in this checkout, else the main checkout's venv
// (git worktrees share it), else the Windows launcher `py -3.13` / python3.
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function venvPython(root) {
  for (const rel of [['backend', '.venv', 'Scripts', 'python.exe'], ['backend', '.venv', 'bin', 'python']]) {
    const p = path.join(root, ...rel);
    if (existsSync(p)) return p;
  }
  return null;
}

export function findPython() {
  if (process.env.PAYRAKSHA_PYTHON) return { cmd: process.env.PAYRAKSHA_PYTHON, args: [] };
  const roots = [ROOT];
  try {
    const common = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (common) roots.push(path.dirname(common));
  } catch { /* not a git checkout */ }
  let dir = ROOT;
  for (let i = 0; i < 6; i++) { dir = path.dirname(dir); roots.push(dir); }
  for (const r of roots) {
    const p = venvPython(r);
    if (p) return { cmd: p, args: [] };
  }
  return process.platform === 'win32' ? { cmd: 'py', args: ['-3.13'] } : { cmd: 'python3', args: [] };
}
