// --------------------------------------------------------------------------
// packages/library/src/formats/kicad-footprint-parser.ts
// Parse KiCad .kicad_mod files (S-expression format) → Footprint.
//
// Handles: pad, fp_line, fp_circle, fp_arc, fp_text, fp_poly, model.
// --------------------------------------------------------------------------

import { Vector2D } from '@opencad/core/math/vector2d';
import {
  Footprint,
  Pad,
  PadShape,
  PadType,
  Layer,
  generateId,
} from '@opencad/core';

import type { GraphicPrimitive } from '../symbols/basic-symbols';
import { parseSExpression, type SExpr } from './kicad-symbol-parser';

/* ================================================================== */
/*  S-expression helpers (re-usable from symbol parser)                */
/* ================================================================== */

function isList(e: SExpr): e is SExpr[] {
  return Array.isArray(e);
}

function head(e: SExpr): string {
  if (isList(e) && typeof e[0] === 'string') return e[0];
  return '';
}

function find(list: SExpr[], tag: string): SExpr[] | undefined {
  for (const e of list) {
    if (isList(e) && head(e) === tag) return e;
  }
  return undefined;
}

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

function atFrom(list: SExpr[]): { x: number; y: number; angle: number } {
  const at = find(list, 'at');
  if (at) return { x: num(at[1]), y: num(at[2]), angle: num(at[3]) };
  return { x: 0, y: 0, angle: 0 };
}

function sizeFrom(list: SExpr[]): { x: number; y: number } {
  const s = find(list, 'size');
  if (s) return { x: num(s[1]), y: num(s[2]) };
  return { x: 0, y: 0 };
}

function strokeWidth(list: SExpr[]): number {
  const stroke = find(list, 'stroke');
  if (stroke) {
    const w = find(stroke, 'width');
    if (w) return num(w[1]);
  }
  // Legacy format: (width N) directly in the element
  const w = find(list, 'width');
  if (w) return num(w[1]);
  return 0.12;
}

function layerStr(list: SExpr[]): string {
  const l = find(list, 'layer');
  if (l) return str(l[1]);
  return '';
}

function layersFrom(list: SExpr[]): string[] {
  const l = find(list, 'layers');
  if (!l) return [];
  return l.slice(1).map((e) => str(e)).filter(Boolean);
}

/* ================================================================== */
/*  Pad shape / type mapping                                           */
/* ================================================================== */

const PAD_SHAPE_MAP: Record<string, PadShape> = {
  circle: PadShape.Circle,
  rect: PadShape.Rect,
  oval: PadShape.Oval,
  roundrect: PadShape.RoundRect,
  custom: PadShape.Custom,
};

const PAD_TYPE_MAP: Record<string, PadType> = {
  smd: PadType.SMD,
  thru_hole: PadType.ThroughHole,
  np_thru_hole: PadType.NPTH,
};

/* ================================================================== */
/*  Converters                                                         */
/* ================================================================== */

function convertPad(expr: SExpr[]): Pad {
  // (pad "1" smd rect (at x y r) (size w h) (layers ...) (drill d)?)
  const padNum = str(expr[1]);
  const padType = str(expr[2]);
  const padShape = str(expr[3]);
  const at = atFrom(expr);
  const size = sizeFrom(expr);
  const layers = layersFrom(expr);
  const drillExpr = find(expr, 'drill');
  const drill = drillExpr ? num(drillExpr[1]) : undefined;

  return {
    id: generateId(),
    number: padNum,
    position: new Vector2D(at.x, at.y),
    size: new Vector2D(size.x, size.y),
    shape: PAD_SHAPE_MAP[padShape] ?? PadShape.Rect,
    type: PAD_TYPE_MAP[padType] ?? PadType.SMD,
    drill,
    layers: layers as Layer[],
    rotation: at.angle ?? 0,
  };
}

function convertFpLine(expr: SExpr[]): GraphicPrimitive | null {
  const startExpr = find(expr, 'start');
  const endExpr = find(expr, 'end');
  if (!startExpr || !endExpr) return null;
  return {
    type: 'line',
    start: new Vector2D(num(startExpr[1]), num(startExpr[2])),
    end: new Vector2D(num(endExpr[1]), num(endExpr[2])),
    width: strokeWidth(expr),
  };
}

function convertFpCircle(expr: SExpr[]): GraphicPrimitive | null {
  const centerExpr = find(expr, 'center');
  const endExpr = find(expr, 'end');
  if (!centerExpr || !endExpr) return null;
  const cx = num(centerExpr[1]), cy = num(centerExpr[2]);
  const ex = num(endExpr[1]), ey = num(endExpr[2]);
  const r = Math.hypot(ex - cx, ey - cy);
  return {
    type: 'circle',
    center: new Vector2D(cx, cy),
    radius: r,
    width: strokeWidth(expr),
  };
}

function convertFpArc(expr: SExpr[]): GraphicPrimitive | null {
  const startExpr = find(expr, 'start');
  const midExpr = find(expr, 'mid');
  const endExpr = find(expr, 'end');
  if (!startExpr || !endExpr) return null;

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
  const ax = sx, ay = sy, bx = mx, by = my, ccx = ex, ccy = ey;
  const D = 2 * (ax * (by - ccy) + bx * (ccy - ay) + ccx * (ay - by));
  if (Math.abs(D) < 1e-10) return null;
  const ux =
    ((ax * ax + ay * ay) * (by - ccy) +
      (bx * bx + by * by) * (ccy - ay) +
      (ccx * ccx + ccy * ccy) * (ay - by)) /
    D;
  const uy =
    ((ax * ax + ay * ay) * (ccx - bx) +
      (bx * bx + by * by) * (ax - ccx) +
      (ccx * ccx + ccy * ccy) * (bx - ax)) /
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

function convertFpText(expr: SExpr[]): GraphicPrimitive | null {
  // (fp_text <type> "text" (at x y r) (effects ...))
  const textContent = str(expr[2]);
  const at = atFrom(expr);
  const effects = find(expr, 'effects');
  let size = 1.0;
  if (effects) {
    const font = find(effects, 'font');
    if (font) {
      const s = sizeFrom(font);
      size = s.y || s.x || 1.0;
    }
  }
  return {
    type: 'text',
    text: textContent,
    position: new Vector2D(at.x, at.y),
    size,
    rotation: at.angle,
  };
}

function convertFpPoly(expr: SExpr[]): GraphicPrimitive | null {
  const ptsExpr = find(expr, 'pts');
  if (!ptsExpr) return null;
  const points = findAll(ptsExpr, 'xy').map((xy) => new Vector2D(num(xy[1]), num(xy[2])));
  if (points.length < 2) return null;
  return {
    type: 'polyline',
    points,
    width: strokeWidth(expr),
  };
}

/* ================================================================== */
/*  Model conversion                                                   */
/* ================================================================== */

function convertModel(
  expr: SExpr[],
): Footprint['model3d'] | undefined {
  // (model "path.step" (offset (xyz x y z)) (scale (xyz ...)) (rotate (xyz ...)))
  const path = str(expr[1]);
  const offsetExpr = find(expr, 'offset');
  const rotateExpr = find(expr, 'rotate');
  const scaleExpr = find(expr, 'scale');

  function xyzFrom(e: SExpr[] | undefined): { x: number; y: number; z: number } {
    if (!e) return { x: 0, y: 0, z: 0 };
    const xyz = find(e, 'xyz');
    if (xyz) return { x: num(xyz[1]), y: num(xyz[2]), z: num(xyz[3]) };
    return { x: 0, y: 0, z: 0 };
  }

  return {
    path,
    offset: xyzFrom(offsetExpr),
    rotation: xyzFrom(rotateExpr),
    scale: scaleExpr ? xyzFrom(scaleExpr) : { x: 1, y: 1, z: 1 },
  };
}

/* ================================================================== */
/*  Public API                                                         */
/* ================================================================== */

/**
 * Parse a KiCad `.kicad_mod` footprint file and return a `Footprint`.
 *
 * @param fileContent  The full text content of a `.kicad_mod` file.
 * @returns            A Footprint object, or `null` if parsing fails.
 *
 * @example
 * ```ts
 * const text = fs.readFileSync('SOIC-8.kicad_mod', 'utf-8');
 * const footprint = parseKiCadFootprint(text);
 * ```
 */
export function parseKiCadFootprint(fileContent: string): Footprint | null {
  const tree = parseSExpression(fileContent);

  // Root should be (footprint "name" ...) or legacy (module "name" ...)
  for (const topLevel of tree) {
    if (
      !isList(topLevel) ||
      (head(topLevel) !== 'footprint' && head(topLevel) !== 'module')
    ) {
      continue;
    }

    const fpName = str(topLevel[1]);
    const pads: Pad[] = [];
    const graphics: GraphicPrimitive[] = [];
    let model3d: Footprint['model3d'] | undefined;
    const properties: Record<string, string> = {};

    // Compute courtyard from fp_line on F.CrtYd layer
    let cyMinX = Infinity,
      cyMinY = Infinity,
      cyMaxX = -Infinity,
      cyMaxY = -Infinity;
    let hasCrtYd = false;

    for (const child of topLevel) {
      if (!isList(child)) continue;
      const tag = head(child);

      switch (tag) {
        case 'pad':
          pads.push(convertPad(child));
          break;

        case 'fp_line': {
          const layer = layerStr(child);
          const g = convertFpLine(child);
          if (g) {
            graphics.push(g);
            if (layer.includes('CrtYd') && g.type === 'line') {
              hasCrtYd = true;
              cyMinX = Math.min(cyMinX, g.start.x, g.end.x);
              cyMinY = Math.min(cyMinY, g.start.y, g.end.y);
              cyMaxX = Math.max(cyMaxX, g.start.x, g.end.x);
              cyMaxY = Math.max(cyMaxY, g.start.y, g.end.y);
            }
          }
          break;
        }

        case 'fp_circle': {
          const g = convertFpCircle(child);
          if (g) graphics.push(g);
          break;
        }

        case 'fp_arc': {
          const g = convertFpArc(child);
          if (g) graphics.push(g);
          break;
        }

        case 'fp_text': {
          const g = convertFpText(child);
          if (g) graphics.push(g);
          break;
        }

        case 'fp_poly': {
          const g = convertFpPoly(child);
          if (g) graphics.push(g);
          break;
        }

        case 'model':
          model3d = convertModel(child);
          break;

        case 'property': {
          const key = str(child[1]);
          const val = str(child[2]);
          if (key) properties[key] = val;
          break;
        }

        case 'descr':
          properties['Description'] = str(child[1]);
          break;
      }
    }

    // Fallback courtyard: bounding box of all pads ± margin
    let cy: Vector2D[];
    if (hasCrtYd) {
      cy = [
        new Vector2D(cyMinX, cyMinY),
        new Vector2D(cyMaxX, cyMinY),
        new Vector2D(cyMaxX, cyMaxY),
        new Vector2D(cyMinX, cyMaxY),
      ];
    } else {
      let pMinX = Infinity,
        pMinY = Infinity,
        pMaxX = -Infinity,
        pMaxY = -Infinity;
      for (const p of pads) {
        pMinX = Math.min(pMinX, p.position.x - p.size.x / 2);
        pMinY = Math.min(pMinY, p.position.y - p.size.y / 2);
        pMaxX = Math.max(pMaxX, p.position.x + p.size.x / 2);
        pMaxY = Math.max(pMaxY, p.position.y + p.size.y / 2);
      }
      const margin = 0.25;
      cy = [
        new Vector2D(pMinX - margin, pMinY - margin),
        new Vector2D(pMaxX + margin, pMinY - margin),
        new Vector2D(pMaxX + margin, pMaxY + margin),
        new Vector2D(pMinX - margin, pMaxY + margin),
      ];
    }

    return {
      id: generateId(),
      name: fpName,
      position: new Vector2D(0, 0),
      rotation: 0,
      pads,
      lines: [],
      arcs: [],
      circles: [],
      texts: [],
      courtyard: cy,
      model3d,
    };
  }

  return null;
}

/**
 * Parse a KiCad footprint library directory.
 * Accepts an array of `{ name, content }` file entries and returns all
 * successfully parsed footprints.
 */
export function parseKiCadFootprintLibrary(
  files: { name: string; content: string }[],
): Footprint[] {
  const results: Footprint[] = [];
  for (const file of files) {
    if (!file.name.endsWith('.kicad_mod')) continue;
    const fp = parseKiCadFootprint(file.content);
    if (fp) results.push(fp);
  }
  return results;
}
