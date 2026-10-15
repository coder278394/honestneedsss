/**
 * Lightweight ICU-subset formatter shared by server + client components.
 *
 * Supports:
 *   - {var}
 *   - {count, plural, one {# campaign} other {# campaigns}}  (# = value)
 *   - {gender, select, male {he} female {she} other {they}}
 *
 * This is deliberately NOT the full ICU spec — the goal is zero new deps while
 * covering 95% of UI copy. If a message needs more, lift it to a dedicated
 * component.
 */

export type Vars = Record<string, string | number | boolean | null | undefined>;

function cardinal(locale: string, n: number): string {
  try {
    return new Intl.PluralRules(locale).select(n);
  } catch {
    return n === 1 ? 'one' : 'other';
  }
}

export function formatMessage(template: string, vars: Vars = {}, locale = 'en'): string {
  if (typeof template !== 'string') return String(template ?? '');
  let out = '';
  let i = 0;
  while (i < template.length) {
    const open = template.indexOf('{', i);
    if (open === -1) {
      out += template.slice(i);
      break;
    }
    out += template.slice(i, open);
    let depth = 1;
    let j = open + 1;
    while (j < template.length && depth > 0) {
      if (template[j] === '{') depth += 1;
      else if (template[j] === '}') depth -= 1;
      if (depth === 0) break;
      j += 1;
    }
    if (depth !== 0) {
      out += template.slice(open);
      break;
    }
    out += renderPlaceholder(template.slice(open + 1, j), vars, locale);
    i = j + 1;
  }
  return out;
}

function renderPlaceholder(inner: string, vars: Vars, locale: string): string {
  const trimmed = inner.trim();
  if (!trimmed.includes(',')) {
    const v = vars[trimmed];
    return v === undefined || v === null ? '' : String(v);
  }
  const c1 = trimmed.indexOf(',');
  const c2 = trimmed.indexOf(',', c1 + 1);
  if (c2 === -1) return '';
  const name = trimmed.slice(0, c1).trim();
  const kind = trimmed.slice(c1 + 1, c2).trim();
  const body = trimmed.slice(c2 + 1).trim();

  if (kind === 'plural') {
    const nRaw = vars[name];
    const n = typeof nRaw === 'number' ? nRaw : Number(nRaw);
    const branches = parseBranches(body);
    const exact = `=${n}`;
    const category = Number.isFinite(n) ? cardinal(locale, n) : 'other';
    const chosen = branches[exact] ?? branches[category] ?? branches.other ?? '';
    return formatMessage(chosen.replace(/#/g, String(n)), vars, locale);
  }

  if (kind === 'select') {
    const key = String(vars[name] ?? '');
    const branches = parseBranches(body);
    const chosen = branches[key] ?? branches.other ?? '';
    return formatMessage(chosen, vars, locale);
  }

  return '';
}

function parseBranches(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  let i = 0;
  while (i < body.length) {
    while (i < body.length && /\s/.test(body[i])) i += 1;
    let end = i;
    while (end < body.length && body[end] !== '{' && !/\s/.test(body[end])) end += 1;
    const key = body.slice(i, end);
    i = end;
    while (i < body.length && /\s/.test(body[i])) i += 1;
    if (body[i] !== '{') break;
    let depth = 1;
    let j = i + 1;
    while (j < body.length && depth > 0) {
      if (body[j] === '{') depth += 1;
      else if (body[j] === '}') depth -= 1;
      if (depth === 0) break;
      j += 1;
    }
    out[key] = body.slice(i + 1, j);
    i = j + 1;
  }
  return out;
}

export function flattenMessages(obj: Record<string, unknown>, prefix = '', out: Record<string, string> = {}): Record<string, string> {
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      flattenMessages(v as Record<string, unknown>, key, out);
    } else if (typeof v === 'string') {
      out[key] = v;
    }
  }
  return out;
}
