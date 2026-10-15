#!/usr/bin/env node
/**
 * Import a translator's edited export back into messages/<locale>.json.
 *
 * Rules:
 *   - MERGE, never replace: existing keys in the target that are absent from
 *     the import stay. Translators sometimes return partial files.
 *   - Report collisions: when the import's `source` disagrees with the current
 *     English source, that's a sign the English text drifted after export.
 *     Those keys are listed loudly and skipped unless `--force` is passed.
 *   - Preserve nested shape: the on-disk file keeps its nested shape; the
 *     imported `a.b.c` keys expand back into {a:{b:{c:value}}}.
 *
 * Usage:
 *   node scripts/i18n/import-translations.js es messages/export/es.json
 *   node scripts/i18n/import-translations.js es messages/export/es.json --force
 */

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const MESSAGES_DIR = path.join(ROOT, 'messages');
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

function unflatten(flat) {
  const out = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.');
    let node = out;
    for (let i = 0; i < parts.length - 1; i += 1) {
      const p = parts[i];
      if (typeof node[p] !== 'object' || node[p] === null) node[p] = {};
      node = node[p];
    }
    node[parts[parts.length - 1]] = value;
  }
  return out;
}

function parseArgs(argv) {
  const positional = [];
  let force = false;
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--force') force = true;
    else if (!argv[i].startsWith('--')) positional.push(argv[i]);
  }
  const [locale, inputFile] = positional;
  if (!locale || !inputFile) {
    console.error('usage: import-translations.js <locale> <export-file.json> [--force]');
    process.exit(1);
  }
  return { locale: locale.toLowerCase(), inputFile: path.resolve(inputFile), force };
}

function main() {
  const { locale, inputFile, force } = parseArgs(process.argv);
  if (locale === SOURCE_LOCALE) {
    console.error(`Refusing to import into source locale '${SOURCE_LOCALE}'. Edit messages/en.json directly.`);
    process.exit(1);
  }

  const sourceFlat = flatten(
    JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, `${SOURCE_LOCALE}.json`), 'utf8'))
  );
  const targetFile = path.join(MESSAGES_DIR, `${locale}.json`);
  const targetFlat = fs.existsSync(targetFile)
    ? flatten(JSON.parse(fs.readFileSync(targetFile, 'utf8')))
    : {};

  const importData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  const stats = { added: 0, updated: 0, unchanged: 0, skipped_drift: 0, missing: 0 };
  const driftKeys = [];

  for (const [key, entry] of Object.entries(importData)) {
    const { source, translation } = entry || {};
    if (!translation) {
      stats.missing += 1;
      continue;
    }
    if (!sourceFlat[key]) {
      // Key no longer exists in source; translator sent a stale export. Skip.
      stats.skipped_drift += 1;
      driftKeys.push({ key, reason: 'key no longer in source' });
      continue;
    }
    if (source && source !== sourceFlat[key]) {
      // Source English changed since export. Needs re-translation.
      if (!force) {
        stats.skipped_drift += 1;
        driftKeys.push({ key, reason: 'source English drifted since export' });
        continue;
      }
    }
    const prev = targetFlat[key];
    if (prev === translation) {
      stats.unchanged += 1;
    } else if (prev === undefined) {
      stats.added += 1;
    } else {
      stats.updated += 1;
    }
    targetFlat[key] = translation;
  }

  const nested = unflatten(targetFlat);
  fs.writeFileSync(targetFile, `${JSON.stringify(nested, null, 2)}\n`, 'utf8');

  console.log(`Imported into ${targetFile}`);
  console.log(JSON.stringify(stats, null, 2));
  if (driftKeys.length) {
    console.log('\nDrift (skipped):');
    for (const d of driftKeys) console.log(`  ${d.key}  — ${d.reason}`);
    console.log(force ? '\n(--force honoured above)' : '\nRe-export, re-translate drifted keys, or pass --force to accept.');
  }
}

if (require.main === module) main();

module.exports = { flatten, unflatten };
