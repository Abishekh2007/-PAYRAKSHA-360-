// Starts the FastAPI backend (simulation only) on 127.0.0.1:$PORT (default 8000).
import { spawn } from 'node:child_process';
import path from 'node:path';
import { ROOT, findPython } from './lib/python.mjs';

const port = process.env.PORT || '8000';
const py = findPython();
const child = spawn(py.cmd, [...py.args, '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', port], { cwd: path.join(ROOT, 'backend'), stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 0));
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill());
