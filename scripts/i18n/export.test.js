/**
 * Unit test for the export sort order + flattener invariants.
 * Keeps the test next to the script so there's no doubt what it covers.
 */

/* eslint-env jest */
const { flatten, sortedEntries } = require('./export-strings');

describe('i18n export', () => {
  test('flatten produces dot-notation keys', () => {
    const flat = flatten({
      common: { ok: 'OK', cancel: 'Cancel' },
      nav: { home: 'Home' },
    });
    expect(flat).toEqual({
      'common.ok': 'OK',
      'common.cancel': 'Cancel',
      'nav.home': 'Home',
    });
  });

  test('flatten ignores non-string leaves', () => {
    const flat = flatten({ a: 1, b: true, c: null, d: 'keep' });
    expect(flat).toEqual({ d: 'keep' });
  });

  test('sortedEntries returns keys in deterministic order', () => {
    const keys = Object.keys(sortedEntries({ z: 1, a: 2, m: 3 }));
    expect(keys).toEqual(['a', 'm', 'z']);
  });
});
