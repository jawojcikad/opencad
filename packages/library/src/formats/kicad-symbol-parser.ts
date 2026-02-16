// --------------------------------------------------------------------------
// packages/library/src/formats/kicad-symbol-parser.ts
// Parse KiCad .kicad_sym files (S-expression format) → Symbol[].
//
// The KiCad symbol library format stores each symbol as an S-expression tree.
// This parser handles: property, pin, polyline, rectangle, circle, arc, text.
// --------------------------------------------------------------------------

import { Vector2D } from '@opencad/core/math/vector2d';
import {
  Symbol,
  Pin,
  PinType,
  PinShape,
  generateId,
} from '@opencad/core';

import type { GraphicPrimitive } from '../symbols/basic-symbols';

/* ================================================================== */
/*  S-expression lexer / parser                                        */
/* ================================================================== */

export type SExpr = string | SExpr[];

/** Tokenise an S-expression string into a flat token list. */
function tokenise(input: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  const len = input.length;

  while (i < len) {
    const ch = input[i];
    // Whitespace
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i++;
      continue;
    }
    // Parentheses
    if (ch === '(' || ch === ')') {
      tokens.push(ch);
      i++;
      continue;
    }
    // Quoted string
    if (ch === '"') {
      let str = '';
      i++; // skip opening quote
      while (i < len && input[i] !== '"') {
        if (input[i] === '\\' && i + 1 < len) {
          str += input[i + 1];
          i += 2;
        } else {
          str += input[i];
          i++;
        }
      }
      i++; // skip closing quote
      tokens.push(str);
      continue;
    }
    // Atom
    let atom = '';
    while (i < len && !' \t\n\r()'.includes(input[i])) {
      atom += input[i];
      i++;
    }
    if (atom.length > 0) {
      tokens.push(atom);
    }
  }

  return tokens;
}

/** Parse tokens into a nested SExpr tree. */
function parseSExpr(tokens: string[]): SExpr[] {
  const result: SExpr[] = [];
  let pos = 0;

  function parseOne(): SExpr {
    if (tokens[pos] === '(') {
      pos++; // skip '('
      const list: SExpr[] = [];
      while (pos < tokens.length && tokens[pos] !== ')') {
        list.push(parseOne());
      }
      pos++; // skip ')'
      return list;
    }
    return tokens[pos++];
  }

  while (pos < tokens.length) {
    result.push(parseOne());
  }
  return result;
}

/** Parse a full S-expression string into a tree. */
export function parseSExpression(input: string): SExpr[] {
  return parseSExpr(tokenise(input));
}

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function isList(e: SExpr): e is SExpr[] {
  return Array.isArray(e);
}

function head(e: SExpr): string {
  if (isList(e) && typeof e[0] === 'string') return e[0];
  return '';
}

/** Find the first sub-list whose head matches `tag`. */
function find(list: SExpr[], tag: string): SExpr[] | undefined {
  for (const e of list) {
    if (isList(e) && head(e) === tag) return e;
  }
  return undefined;
}

/** Find ALL sub-lists whose head matches `tag`. */
function findAll(list: SExpr[], tag: string): SExpr[][] {
  const result: SExpr[][] = [];
  for (const e of list) {
    if (isList(e) && head(e) === tag) result.push(e);
  }
  return result;
}

function num(e: SExpr | undefined): number {
  if (typeof e === 'string') return parseFloat(e) || 0;
  return 0;
}

function str(e: SExpr | undefined): string {
  if (typeof e === 'string') return e;
  return '';
}

function xyFrom(list: SExpr[]): { x: number; y: number } {
  const xy = find(list, 'xy') ?? find(list, 'at');
  if (xy) return { x: num(xy[1]), y: num(xy[2]) };
  return { x: 0, y: 0 };
}

function atFrom(list: SExpr[]): { x: number; y: number; angle: number } {
  const at = find(list, 'at');
  if (at) return { x: num(at[1]), y: num(at[2]), angle: num(at[3]) };
  return { x: 0, y: 0, angle: 0 };
}

function strokeWidth(list: SExpr[]): number {
  const stroke = find(list, 'stroke');
  if (stroke) {
    const w = find(stroke, 'width');
    if (w) return num(w[1]);
  }
  return 0.254; // default ~10 mil
}

function isFilled(list: SExpr[]): boolean {
  const fill = find(list, 'fill');
  if (fill) {
    const t = find(fill, 'type');
    if (t) return str(t[1]) === 'outline' || str(t[1]) === 'background';
  }
  return false;
}

/* ================================================================== */
/*  Pin type / shape mapping                                           */
/* ================================================================== */

const PIN_TYPE_MAP: Record<string, PinType> = {
  input: PinType.Input,
  output: PinType.Output,
  bidirectional: PinType.Bidirectional,
  passive: PinType.Passive,
  power_in: PinType.PowerInput,
  power_out: PinType.PowerOutput,
  open_collector: PinType.OpenCollector,
  open_emitter: PinType.OpenEmitter,
  unspecified: PinType.Unspecified,
  no_connect: PinType.NotConnected,
  tri_state: PinType.Unspecified, // No Tristate in our enum
  free: PinType.Unspecified,
};

const PIN_SHAPE_MAP: Record<string, PinShape> = {
  line: PinShape.Line,
  inverted: PinShape.Inverted,
  clock: PinShape.Clock,
  inverted_clock: PinShape.InvertedClock,
  input_low: PinShape.Line,
  clock_low: PinShape.Clock,
  output_low: PinShape.Line,
  edge_clock_high: PinShape.Clock,
  non_logic: PinShape.Line,
};

/* ================================================================== */
/*  Conversion: KiCad S-expr → our Symbol                              */
/* ================================================================== */

function convertPin(pinExpr: SExpr[]): Pin {
  // (pin <type> <shape> (at x y angle) (length l) (name "N") (number "1"))
  const pinType = str(pinExpr[1]);
  const pinShape = str(pinExpr[2]);
  const at = atFrom(pinExpr);
  const lenExpr = find(pinExpr, 'length');
  const length = lenExpr ? num(lenExpr[1]) : 2.54;
  const nameExpr = find(pinExpr, 'name');
  const numExpr = find(pinExpr, 'number');

  return {
    id: generateId(),
    name: nameExpr ? str(nameExpr[1]) : '',
    number: numExpr ? str(numExpr[1]) : '',
    position: new Vector2D(at.x, at.y),
    orientation: at.angle,
    type: PIN_TYPE_MAP[pinType] ?? PinType.Unspecified,
    shape: PIN_SHAPE_MAP[pinShape] ?? PinShape.Line,
    length: length * 39.3701, // mm → mils (1 mm ≈ 39.37 mil)
  };
}

function convertPolyline(expr: SExpr[]): GraphicPrimitive | null {
  const ptsExpr = find(expr, 'pts');
  if (!ptsExpr) return null;
  const points = findAll(ptsExpr, 'xy').map((xy) => new Vector2D(num(xy[1]), num(xy[2])));
  if (points.length < 2) return null;
  return {
    type: 'polyline',
    points,
    width: strokeWidth(expr),
    fill: isFilled(expr),
  };
}

function convertRectangle(expr: SExpr[]): GraphicPrimitive | null {
  const startExpr = find(expr, 'start');
  const endExpr = find(expr, 'end');
  if (!startExpr || !endExpr) return null;
  return {
    type: 'rectangle',
    start: new Vector2D(num(startExpr[1]), num(startExpr[2])),
    end: new Vector2D(num(endExpr[1]), num(endExpr[2])),
    width: strokeWidth(expr),
    fill: isFilled(expr),
  };
}

function convertCircle(expr: SExpr[]): GraphicPrimitive | null {
  const centerExpr = find(expr, 'center');
  const radiusExpr = find(expr, 'radius');
  if (!centerExpr || !radiusExpr) return null;
  return {
    type: 'circle',
    center: new Vector2D(num(centerExpr[1]), num(centerExpr[2])),
    radius: num(radiusExpr[1]),
    width: strokeWidth(expr),
    fill: isFilled(expr),
  };
}

function convertArc(expr: SExpr[]): GraphicPrimitive | null {
  const startExpr = find(expr, 'start');
  const midExpr = find(expr, 'mid');
  const endExpr = find(expr, 'end');
  if (!startExpr || !endExpr) return null;

  // Compute arc centre and angles from start/mid/end points
  const sx = num(startExpr[1]), sy = num(startExpr[2]);
  const ex = num(endExpr[1]), ey = num(endExpr[2]);
  let mx: number, my: number;
  if (midExpr) {
    mx = num(midExpr[1]);
    my = num(midExpr[2]);
  } else {
    mx = (sx + ex) / 2;
    my = (sy + ey) / 2;
  }

  // Circumscribed circle through 3 points
  const ax = sx, ay = sy, bx = mx, by = my, cx = ex, cy = ey;
  const D = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if (Math.abs(D) < 1e-10) return null;
  const ux =
    ((ax * ax + ay * ay) * (by - cy) +
      (bx * bx + by * by) * (cy - ay) +
      (cx * cx + cy * cy) * (ay - by)) /
    D;
  const uy =
    ((ax * ax + ay * ay) * (cx - bx) +
      (bx * bx + by * by) * (ax - cx) +
      (cx * cx + cy * cy) * (bx - ax)) /
    D;
  const r = Math.hypot(ax - ux, ay - uy);
  const startAngle = (Math.atan2(ay - uy, ax - ux) * 180) / Math.PI;
  const endAngle = (Math.atan2(ey - uy, ex - ux) * 180) / Math.PI;

  return {
    type: 'arc',
    center: new Vector2D(ux, uy),
    radius: r,
    startAngle,
    endAngle,
    width: strokeWidth(expr),
  };
}

function convertText(expr: SExpr[]): GraphicPrimitive | null {
  const content = str(expr[1]);
  const at = atFrom(expr);
  const effects = find(expr, 'effects');
  let size = 1.27;
  if (effects) {
    const font = find(effects, 'font');
    if (font) {
      const sizeExpr = find(font, 'size');
      if (sizeExpr) size = num(sizeExpr[1]);
    }
  }
  return {
    type: 'text',
    text: content,
    position: new Vector2D(at.x, at.y),
    size: size * 39.3701,
    rotation: at.angle,
  };
}

function convertSymbolUnit(unitExpr: SExpr[]): {
  graphics: GraphicPrimitive[];
  pins: Pin[];
} {
  const graphics: GraphicPrimitive[] = [];
  const pins: Pin[] = [];

  for (const child of unitExpr) {
    if (!isList(child)) continue;
    const tag = head(child);
    let g: GraphicPrimitive | null = null;

    switch (tag) {
      case 'polyline':
        g = convertPolyline(child);
        break;
      case 'rectangle':
        g = convertRectangle(child);
        break;
      case 'circle':
        g = convertCircle(child);
        break;
      case 'arc':
        g = convertArc(child);
        break;
      case 'text':
        g = convertText(child);
        break;
      case 'pin':
        pins.push(convertPin(child));
        break;
    }
    if (g) graphics.push(g);
  }

  return { graphics, pins };
}

/* ================================================================== */
/*  Public API                                                         */
/* ================================================================== */

/**
 * Parse a KiCad `.kicad_sym` file and return an array of `Symbol` objects.
 *
 * @param fileContent  The full text content of a `.kicad_sym` file.
 * @returns            An array of Symbol objects extracted from the file.
 *
 * @example
 * ```ts
 * const text = fs.readFileSync('Device.kicad_sym', 'utf-8');
 * const symbols = parseKiCadSymbolLibrary(text);
 * ```
 */
export function parseKiCadSymbolLibrary(fileContent: string): Symbol[] {
  const tree = parseSExpression(fileContent);
  const symbols: Symbol[] = [];

  // The root is (kicad_symbol_lib ...) containing (symbol ...) children.
  for (const topLevel of tree) {
    if (!isList(topLevel) || head(topLevel) !== 'kicad_symbol_lib') continue;

    for (const child of topLevel) {
      if (!isList(child) || head(child) !== 'symbol') continue;
      const symName = str(child[1]);

      // Collect properties
      const properties: Record<string, string> = {};
      for (const prop of findAll(child, 'property')) {
        const key = str(prop[1]);
        const value = str(prop[2]);
        if (key) properties[key] = value;
      }

      // Collect graphics and pins from all sub-units
      const allGraphics: GraphicPrimitive[] = [];
      const allPins: Pin[] = [];

      // Direct children of the symbol (unit 0 / graphical items)
      const { graphics: g0, pins: p0 } = convertSymbolUnit(child);
      allGraphics.push(...g0);
      allPins.push(...p0);

      // Named sub-units: (symbol "Name_1_1" ...)
      for (const subSym of findAll(child, 'symbol')) {
        const { graphics: gN, pins: pN } = convertSymbolUnit(subSym);
        allGraphics.push(...gN);
        allPins.push(...pN);
      }

      symbols.push({
        id: generateId(),
        name: symName,
        pins: allPins,
        lines: [],
        arcs: [],
        rectangles: [],
        circles: [],
        texts: [],
      });
    }
  }

  return symbols;
}
