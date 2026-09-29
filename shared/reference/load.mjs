// Node-only helper: loads every shared/*.json config the reference engine needs.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SHARED = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (name) => JSON.parse(readFileSync(join(SHARED, name), 'utf8'));

export function loadConfig() {
  return {
    engine: readJson('engine-config.json'),
    lexicon: readJson('lexicon.json'),
    urlRules: readJson('url-rules.json'),
    recipients: readJson('recipients.json'),
    patterns: readJson('patterns.json'),
  };
}

export function loadScenarios() {
  return readJson('scenarios.json');
}
