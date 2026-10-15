#!/usr/bin/env node
/**
 * Export the frontend message catalogue as a sorted, flattened JSON that
 * translators can use. Produces one file per locale under `./messages/export/`.
 *
 * Output shape (translator-friendly):
 *   {
 *     "common.ok":                       { "source": "OK",         "translation": "OK" },
 *     "nav.campaigns":                   { "source": "Campaigns",  "translation": "Campañas" },
 *     "campaigns.count":                 { "source": "{count, ...", "translation": "{count, ...}" }
 *   }
 *
 * `source` is always English; `translation` is the current target locale value
 * (or empty if missing). The format is deterministic (sorted keys) so git diffs
 * read cleanly across runs.
 *
 * Usage:
 *   node scripts/i18n/export-strings.js            # all non-English locales
 *   node scripts/i18n/export-strings.js es         # one locale
 *   node scripts/i18n/export-strings.js --out dist # custom out dir
 */

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const MESSAGES_DIR = path.join(ROOT, 'messages');
const DEFAULT_OUT = path.join(MESSAGES_DIR, 'export');
const SOURCE_LOCALE = 'en';

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      flatten(v, key, out);
    } else if (typeof v === 'string') {
      out[key] = v;
    }
  }
  return out;
}

function readLocale(locale) {
  const file = path.join(MESSAGES_DIR, `${locale}.json`);
  if (!fs.existsSync(file)) throw new Error(`Locale file not found: ${file}`);
  return flatten(JSON.parse(fs.readFileSync(file, 'utf8')));
}

function sortedEntries(obj) {
  return Object.keys(obj).sort().reduce((acc, k) => {
    acc[k] = obj[k];
    return acc;
  }, {});
}

function parseArgs(argv) {
  const args = { locales: [], out: DEFAULT_OUT };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--out') args.out = path.resolve(argv[i + 1]);
    else if (!a.startsWith('--')) args.locales.push(a.toLowerCase());
  }
  return args;
}

function allLocales() {
  return fs
    .readdirSync(MESSAGES_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''))
    .filter((l) => l !== SOURCE_LOCALE);
}

function main() {
  const args = parseArgs(process.argv);
  const source = readLocale(SOURCE_LOCALE);
  const locales = args.locales.length > 0 ? args.locales : allLocales();

  fs.mkdirSync(args.out, { recursive: true });

  for (const locale of locales) {
    const target = (() => {
      try { return readLocale(locale); } catch { return {}; }
    })();

    const unified = {};
    for (const key of Object.keys(source).sort()) {
      unified[key] = { source: source[key], translation: target[key] || '' };
    }
    const outFile = path.join(args.out, `${locale}.json`);
    fs.writeFileSync(outFile, `${JSON.stringify(sortedEntries(unified), null, 2)}\n`, 'utf8');
    const missing = Object.values(unified).filter((v) => !v.translation).length;
    console.log(`  ${locale}: ${outFile}  (${missing} missing)`);
  }
}

if (require.main === module) main();

module.exports = { flatten, readLocale, sortedEntries };
