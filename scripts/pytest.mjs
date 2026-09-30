// Runs the backend tests with the project's Python: `npm run test:py [-- pytest args]` (paths relative to backend/).
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { ROOT, findPython } from './lib/python.mjs';

const py = findPython();
// No args: the backend tests plus the Python acceptance tests in test/acceptance.
const args = process.argv.length > 2 ? process.argv.slice(2) : ['tests', '../test/acceptance'];
const r = spawnSync(py.cmd, [...py.args, '-m', 'pytest', ...args], { cwd: path.join(ROOT, 'backend'), stdio: 'inherit' });
if (r.error) { console.error(r.error.message); process.exit(1); }
process.exit(r.status ?? 1);
