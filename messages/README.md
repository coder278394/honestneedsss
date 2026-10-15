# `/messages` — frontend translations

One JSON per locale. English (`en.json`) is the source of truth. Translators
work on exported bundles (`export-strings.js`) and send back files that
`import-translations.js` merges in.

## Shape

Nested on disk for human readability:

```jsonc
{
  "common": { "ok": "OK" },
  "campaigns": {
    "title": "Campaigns",
    "count": "{count, plural, one {# campaign} other {# campaigns}}"
  }
}
```

Flattened in memory to `common.ok`, `campaigns.title`, `campaigns.count`.

## Message format (ICU subset)

Supported:

- `{var}` — simple substitution.
- `{count, plural, one {# campaign} other {# campaigns}}` — plural with `#` = value.
- `{gender, select, male {he} female {she} other {they}}` — select.

Not supported (yet): nested formats, number/date/time ICU types. Full ICU can
land later via `next-intl`; the key shape here is designed to be compatible.

## Workflow

1. **Author** English keys inline in `en.json`. Add the key before you push.
2. **Export** for translators:

   ```
   node scripts/i18n/export-strings.js es
   # writes messages/export/es.json with { "key": { "source", "translation" } } entries
   ```

3. **Translator** fills `translation` fields. Keys MUST stay unchanged.

4. **Import** the returned file:

   ```
   node scripts/i18n/import-translations.js es messages/export/es.json
   ```

   The importer MERGES — existing keys the translator didn't touch stay. Keys
   whose English source has drifted since export are **skipped and reported**;
   re-export or pass `--force` after confirming.

5. **Commit** the updated `messages/<locale>.json`.

## Linting

New untranslated strings slip in through literals in JSX. Phase 1.6 ships
`react/jsx-no-literals` scoped to extracted route groups; expand per PR.

## Adding a locale

1. Add the primary subtag to `lib/i18n/config.ts` (`SUPPORTED_LOCALES`,
   `LOCALE_LABELS`).
2. Add it to backend `src/config/i18n.js` and `I18N_SUPPORTED_LOCALES` env.
3. Create `messages/<locale>.json` (copy `en.json` as a starting point).
4. Import translations as above.

Keep the frontend + backend allowlists in sync — a locale enabled on one side
but not the other will log fallbacks server-side on every email send.
