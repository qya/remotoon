// Infers a typed "knobs" schema from `$PROPS.NAME ?? default` usages so the
// properties panel can render color pickers, sliders, toggles and text inputs
// for any component, including ones written by AI.

export type PropKind = 'color' | 'number' | 'boolean' | 'text';

export interface PropField {
  key: string;
  label: string;
  kind: PropKind;
  defaultValue?: string | number | boolean;
  multiline?: boolean;
}

const PROP_USAGE =
  /\$PROPS\.([A-Za-z_][A-Za-z0-9_]*)(?:\s*(?:\|\||\?\?)\s*("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`[^`]*`|-?\d+(?:\.\d+)?|true|false))?/g;

const COLOR_VALUE = /^(#[0-9a-f]{3,8}|rgba?\(.*\)|hsla?\(.*\))$/i;
const COLOR_KEY = /(^|_)(COLOU?R|COLOU?RS|BG|BACKGROUND|FILL|STROKE|TINT)(_|$)|color|fill|stroke|background/i;
const NUMBER_KEY = /(SIZE|DURATION|SPEED|COUNT|WIDTH|HEIGHT|RADIUS|DELAY|OPACITY|SCALE|BLUR|ANGLE|ROTATION|AMOUNT|STRENGTH|INTENSITY|FRAMES?|GAP|PADDING|SPACING|THICKNESS|DAMPING|STIFFNESS|VALUE|NUMBER|X|Y)$/i;

const unquote = (literal: string) => {
  const body = literal.slice(1, -1);
  if (literal.startsWith('`')) return body;
  try {
    return JSON.parse(literal.startsWith("'") ? `"${body.replace(/"/g, '\\"')}"` : literal) as string;
  } catch {
    return body;
  }
};

export const humanizeKey = (key: string) => {
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .toLowerCase()
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

export const inferPropsSchema = (code: string | undefined): PropField[] => {
  if (!code) return [];
  const fields = new Map<string, PropField>();
  let m: RegExpExecArray | null;
  PROP_USAGE.lastIndex = 0;

  while ((m = PROP_USAGE.exec(code)) !== null) {
    const key = m[1];
    const literal = m[2];
    const existing = fields.get(key);
    if (existing && existing.defaultValue !== undefined) continue;

    let kind: PropKind = 'text';
    let defaultValue: PropField['defaultValue'];

    if (literal !== undefined) {
      if (literal === 'true' || literal === 'false') {
        kind = 'boolean';
        defaultValue = literal === 'true';
      } else if (/^-?\d/.test(literal)) {
        kind = 'number';
        defaultValue = parseFloat(literal);
      } else {
        const str = unquote(literal);
        defaultValue = str;
        kind = COLOR_VALUE.test(str.trim()) ? 'color' : 'text';
      }
    } else if (COLOR_KEY.test(key)) {
      kind = 'color';
    } else if (NUMBER_KEY.test(key)) {
      kind = 'number';
    }

    fields.set(key, {
      key,
      label: humanizeKey(key),
      kind,
      defaultValue,
      multiline: kind === 'text' && typeof defaultValue === 'string' && defaultValue.length > 40,
    });
  }

  return Array.from(fields.values());
};

// <input type="color"> only understands #rrggbb.
export const toHexColor = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
  if (/^#[0-9a-f]{8}$/i.test(v)) return v.slice(0, 7).toLowerCase();
  if (/^#[0-9a-f]{3,4}$/i.test(v)) {
    return ('#' + v.slice(1, 4).split('').map((c) => c + c).join('')).toLowerCase();
  }
  return null;
};
