#!/usr/bin/env node
/**
 * Phase 0 — Frontend convention check.
 *
 * Rule: authenticated calls go through `lib/api.ts` apiClient. No new `.ts(x)`
 * file under app/, components/, features/, hooks/, services/ may import `axios`
 * directly or use `fetch(` at module scope, except:
 *
 *   - `lib/api.ts` itself,
 *   - files inside `scripts/`, `tests/`, `node_modules/`, `.next/`, `build/`,
 *   - a line with the escape marker `// api-client-exempt` immediately above.
 *
 * Exit code 0 = clean, 1 = violations.
 *
 * Run locally:   node scripts/check-apiclient-usage.js
 * In CI:         npm run check:apiclient   (wire into package.json scripts)
 *
 * Written as plain Node — no deps — so it runs before `npm install` in CI if
 * needed.
 */

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const INCLUDE_DIRS = ['app', 'components', 'features', 'hooks', 'services', 'store'];
const SKIP_DIRS = new Set([
  'node_modules', '.next', 'build', 'dist', 'out', 'coverage', 'scripts', 'tests',
]);
const EXEMPT_FILES = new Set([
  path.join(ROOT, 'lib', 'api.ts'),
]);
const EXEMPT_MARKER = '// api-client-exempt';

// Per-line match so the reported line number is the line that actually imports.
// Covers common single-line forms: `import x from 'axios'`, `import { X } from 'axios'`,
// `import 'axios'`, and bare `require('axios')`. A pure type-only import
// (`import type ... from 'axios'`) is allowed since TS strips it at build time.
const AXIOS_IMPORT_LINE = /(^|\s)(import(?!\s+type\b)[^\n]*?from\s+['"]axios['"]|import\s+['"]axios['"]|require\s*\(\s*['"]axios['"]\s*\))/;
// Matches top-level `fetch(` and `globalThis.fetch(` style usages. Allows
// `window.fetch` inside clearly-commented blocks via the escape marker.
const FETCH_CALL = /(?<!\w)(?:await\s+)?(?:global(?:This)?\.)?fetch\s*\(/;

/** @returns {string[]} absolute paths of .ts/.tsx files to scan */
function walk(dir) {
  const found = [];
  if (!fs.existsSync(dir)) return found;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...walk(full));
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      found.push(full);
    }
  }
  return found;
}

function checkFile(filePath) {
  if (EXEMPT_FILES.has(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const violations = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const previous = (lines[i - 1] || '').trim();
    if (previous.includes(EXEMPT_MARKER)) continue;

    if (AXIOS_IMPORT_LINE.test(line)) {
      violations.push({
        line: i + 1,
        snippet: line.trim(),
        reason: 'imports axios directly — use apiClient from lib/api.ts',
      });
      continue;
    }
    if (FETCH_CALL.test(line)) {
      violations.push({
        line: i + 1,
        snippet: line.trim(),
        reason: 'raw fetch() call — use apiClient from lib/api.ts',
      });
    }
  }

  return violations;
}

function main() {
  const targetFiles = INCLUDE_DIRS.flatMap((d) => walk(path.join(ROOT, d)));
  const findings = [];
  for (const file of targetFiles) {
    const vs = checkFile(file);
    for (const v of vs) findings.push({ file: path.relative(ROOT, file), ...v });
  }

  if (findings.length === 0) {
    console.log(`apiClient check: OK (${targetFiles.length} files scanned).`);
    process.exit(0);
  }

  console.error(`apiClient check FAILED — ${findings.length} violation(s):`);
  for (const f of findings) {
    console.error(`  ${f.file}:${f.line}  ${f.reason}`);
    console.error(`    > ${f.snippet}`);
  }
  console.error('\nFix: use `apiClient` from `lib/api.ts`. If this file truly needs');
  console.error('direct fetch/axios (SSG, external services, etc.), add this line');
  console.error('IMMEDIATELY ABOVE the offending line:\n');
  console.error(`    ${EXEMPT_MARKER}\n`);
  process.exit(1);
}

if (require.main === module) main();

module.exports = { walk, checkFile };
