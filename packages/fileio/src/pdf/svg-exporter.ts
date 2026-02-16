import {
  SchematicDocument,
  PCBDocument,
  Sheet,
  SchematicComponent,
  Wire,
  NetLabel,
  Track,
  Via,
  Footprint,
  Pad,
  CopperZone,
  BoardOutline,
  Layer,
  Vector2D,
} from '@opencad/core';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Rotate a point about an origin by `angleDeg` degrees. */
function rotatePoint(
  p: Vector2D,
  origin: Vector2D,
  angleDeg: number,
): Vector2D {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = p.x - origin.x;
  const dy = p.y - origin.y;
  return new Vector2D(
    origin.x + dx * cos - dy * sin,
    origin.y + dx * sin + dy * cos
  );
}

/** Default layer colours (used when no colour is specified). */
const DEFAULT_LAYER_COLORS: Record<string, string> = {
  'F.Cu':   '#c83232',
  'B.Cu':   '#3232c8',
  'F.Silk': '#c8c832',
  'B.Silk': '#c832c8',
  'F.Mask': '#c86432',
  'B.Mask': '#32c864',
  'Edge.Cuts': '#c8c800',
  default:  '#888888',
};

function layerColor(layer: Layer | string): string {
  const name = typeof layer === 'string' ? layer : (layer as any).name ?? '';
  return (layer as any)?.color ?? DEFAULT_LAYER_COLORS[name] ?? DEFAULT_LAYER_COLORS['default'];
}

/* ------------------------------------------------------------------ */
/*  SVGExporter                                                        */
/* ------------------------------------------------------------------ */

/**
 * Export schematic sheets or PCB layers to standalone SVG documents.
 */
export class SVGExporter {
  /* ================================================================ */
  /*  Public API                                                       */
  /* ================================================================ */

  /**
   * Export a schematic document (or a single sheet) to SVG.
   *
   * @param document       The schematic document.
   * @param sheetIndex     If provided, only that sheet is rendered;
   *                       otherwise the first sheet is used.
   */
  exportSchematic(
    document: SchematicDocument,
    sheetIndex?: number,
  ): string {
    const sheets: Sheet[] = (document as any).sheets ?? [];
    const idx = sheetIndex ?? 0;
    const sheet = sheets[idx];
    if (!sheet) {
      throw new Error(
        `Sheet index ${idx} out of range (${sheets.length} sheets available)`,
      );
    }
    return this.renderSchematicToSVG(sheet);
  }

  /**
   * Export specific PCB layers to a single SVG document.
   */
  exportPCBLayer(document: PCBDocument, layers: Layer[]): string {
    return this.renderPCBToSVG(document, layers);
  }

  /* ================================================================ */
  /*  Schematic rendering                                              */
  /* ================================================================ */

  private renderSchematicToSVG(sheet: Sheet): string {
    const width: number = (sheet as any).width ?? 297; // A4 landscape mm
    const height: number = (sheet as any).height ?? 210;
    const parts: string[] = [];

    parts.push(
      this.svgHeader(width, height, `0 0 ${width} ${height}`),
    );

    // Background
    parts.push(
      this.svgRect(0, 0, width, height, 'none', '#ffffff'),
    );

    // Border
    parts.push(
      this.svgRect(5, 5, width - 10, height - 10, '#000000', 'none'),
    );

    // ---------- Wires ----------
    const wires: Wire[] = (sheet as any).wires ?? [];
    for (const wire of wires) {
      const start: Vector2D = (wire as any).start ?? { x: 0, y: 0 };
      const end: Vector2D = (wire as any).end ?? { x: 0, y: 0 };
      parts.push(
        this.svgLine(start.x, start.y, end.x, end.y, '#00aa00', 0.3),
      );
    }

    // ---------- Net labels ----------
    const labels: NetLabel[] = (sheet as any).netLabels ?? [];
    for (const label of labels) {
      const pos: Vector2D = (label as any).position ?? { x: 0, y: 0 };
      const name: string = (label as any).name ?? '';
      parts.push(this.svgText(name, pos.x, pos.y, 3, '#0000cc'));
    }

    // ---------- Components ----------
    const components: SchematicComponent[] =
      (sheet as any).components ?? [];

    for (const comp of components) {
      const pos: Vector2D = (comp as any).position ?? { x: 0, y: 0 };
      const rot: number = (comp as any).rotation ?? 0;
      const ref: string = (comp as any).reference ?? '';
      const value: string = (comp as any).value ?? '';

      // Symbol graphics
      const symbol = (comp as any).symbol;
      if (symbol) {
        const graphics: any[] = (symbol as any).graphics ?? [];
        parts.push(
          `<g transform="translate(${pos.x},${pos.y}) rotate(${rot})">`,
        );

        for (const g of graphics) {
          const type: string = (g as any).type ?? '';
          switch (type) {
            case 'line': {
              const s = (g as any).start ?? { x: 0, y: 0 };
              const e = (g as any).end ?? { x: 0, y: 0 };
              parts.push(
                this.svgLine(s.x, s.y, e.x, e.y, '#800000', 0.25),
              );
              break;
            }
            case 'rect':
            case 'rectangle': {
              const rx = (g as any).x ?? 0;
              const ry = (g as any).y ?? 0;
              const rw = (g as any).width ?? 5;
              const rh = (g as any).height ?? 5;
              parts.push(
                this.svgRect(rx, ry, rw, rh, '#800000', '#ffffcc'),
              );
              break;
            }
            case 'circle': {
              const cx = (g as any).cx ?? 0;
              const cy = (g as any).cy ?? 0;
              const r = (g as any).r ?? 1;
              parts.push(
                this.svgCircle(cx, cy, r, '#800000', 'none'),
              );
              break;
            }
            case 'arc': {
              const d = (g as any).d ?? '';
              parts.push(this.svgPath(d, '#800000', 'none'));
              break;
            }
            case 'polygon': {
              const pts: Vector2D[] = (g as any).points ?? [];
              parts.push(
                this.svgPolygon(pts, '#800000', '#ffffcc'),
              );
              break;
            }
          }
        }

        // Pins
        const pins: any[] = (symbol as any).pins ?? [];
        for (const pin of pins) {
          const pp: Vector2D = (pin as any).position ?? { x: 0, y: 0 };
          parts.push(
            this.svgCircle(pp.x, pp.y, 0.5, '#cc0000', '#cc0000'),
          );
          const pinName: string = (pin as any).name ?? '';
          if (pinName) {
            parts.push(this.svgText(pinName, pp.x + 1, pp.y - 0.5, 2));
          }
        }

        parts.push('</g>');
      } else {
        // Fallback: draw a box for the component
        parts.push(
          this.svgRect(pos.x - 3, pos.y - 3, 6, 6, '#800000', '#ffffcc'),
        );
      }

      // Reference & value labels
      parts.push(this.svgText(ref, pos.x, pos.y - 4, 2.5, '#000000'));
      parts.push(
        this.svgText(value, pos.x, pos.y + 6, 2, '#666666'),
      );
    }

    parts.push(this.svgFooter());
    return parts.join('\n');
  }

  /* ================================================================ */
  /*  PCB rendering                                                    */
  /* ================================================================ */

  private renderPCBToSVG(
    document: PCBDocument,
    layers: Layer[],
  ): string {
    // Compute bounding box from board outline or fallback
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    const outline: BoardOutline | undefined = (document as any).boardOutline;
    const outlineVerts: Vector2D[] = (outline as any)?.vertices ?? [];
    for (const v of outlineVerts) {
      minX = Math.min(minX, v.x);
      minY = Math.min(minY, v.y);
      maxX = Math.max(maxX, v.x);
      maxY = Math.max(maxY, v.y);
    }
    if (!isFinite(minX)) {
      minX = 0;
      minY = 0;
      maxX = 100;
      maxY = 100;
    }

    const margin = 5;
    const vbX = minX - margin;
    const vbY = minY - margin;
    const vbW = maxX - minX + margin * 2;
    const vbH = maxY - minY + margin * 2;

    const parts: string[] = [];
    parts.push(this.svgHeader(vbW * 4, vbH * 4, `${vbX} ${vbY} ${vbW} ${vbH}`));

    // Background
    parts.push(
      this.svgRect(vbX, vbY, vbW, vbH, 'none', '#1a1a2e'),
    );

    const layerIds = new Set(
      layers.map((l) => (l as any).id ?? (l as any).name ?? ''),
    );
    const layerNames = new Set(
      layers.map((l) => (l as any).name ?? ''),
    );

    const matchesLayer = (val: string | string[]): boolean => {
      if (Array.isArray(val)) {
        return val.some(
          (v) => layerIds.has(v) || layerNames.has(v),
        );
      }
      return layerIds.has(val) || layerNames.has(val);
    };

    // Board outline
    if (outlineVerts.length > 0) {
      parts.push(
        this.svgPolygon(outlineVerts, '#c8c800', 'none'),
      );
    }

    // Copper zones
    const zones: CopperZone[] = (document as any).zones ?? [];
    for (const zone of zones) {
      const zLayer = (zone as any).layer ?? '';
      if (!matchesLayer(zLayer)) continue;
      const pts: Vector2D[] = (zone as any).outline ?? [];
      if (pts.length >= 3) {
        const color = layerColor(zLayer);
        parts.push(this.svgPolygon(pts, color, color + '44'));
      }
    }

    // Tracks
    const tracks: Track[] = (document as any).tracks ?? [];
    for (const track of tracks) {
      const tLayer = (track as any).layer ?? '';
      if (!matchesLayer(tLayer)) continue;
      const start: Vector2D = (track as any).start ?? { x: 0, y: 0 };
      const end: Vector2D = (track as any).end ?? { x: 0, y: 0 };
      const width: number = (track as any).width ?? 0.25;
      const color = layerColor(tLayer);
      parts.push(this.svgLine(start.x, start.y, end.x, end.y, color, width));
    }

    // Vias
    const vias: Via[] = (document as any).vias ?? [];
    for (const via of vias) {
      const viaLayers: string[] = (via as any).layers ?? [];
      if (viaLayers.length > 0 && !matchesLayer(viaLayers)) continue;
      const pos: Vector2D = (via as any).position ?? { x: 0, y: 0 };
      const diameter: number = (via as any).diameter ?? 0.6;
      const drill: number = (via as any).drill ?? 0.3;

      parts.push(this.svgCircle(pos.x, pos.y, diameter / 2, '#c8c832', '#c8c832'));
      parts.push(this.svgCircle(pos.x, pos.y, drill / 2, '#1a1a2e', '#1a1a2e'));
    }

    // Footprints / pads
    const footprints: Footprint[] = (document as any).footprints ?? [];
    for (const fp of footprints) {
      const fpPos: Vector2D = (fp as any).position ?? { x: 0, y: 0 };
      const fpRot: number = (fp as any).rotation ?? 0;
      const pads: Pad[] = (fp as any).pads ?? [];

      for (const pad of pads) {
        const padLayers: string[] = (pad as any).layers ?? [];
        if (padLayers.length > 0 && !matchesLayer(padLayers)) continue;

        const padPos: Vector2D = (pad as any).position ?? new Vector2D(0, 0);
        const size: Vector2D = (pad as any).size ?? new Vector2D(1, 1);
        const shape: string = (pad as any).shape ?? 'circle';

        const local: Vector2D = new Vector2D(
          fpPos.x + padPos.x,
          fpPos.y + padPos.y
        );
        const abs = rotatePoint(local, fpPos, fpRot);

        const color = padLayers.length > 0 ? layerColor(padLayers[0]) : '#cc0000';

        switch (shape) {
          case 'circle':
            parts.push(
              this.svgCircle(abs.x, abs.y, size.x / 2, color, color),
            );
            break;
          case 'rect':
          case 'rectangle':
            parts.push(
              this.svgRect(
                abs.x - size.x / 2,
                abs.y - size.y / 2,
                size.x,
                size.y,
                color,
                color,
              ),
            );
            break;
          case 'obround':
          case 'oval': {
            const rx = size.x / 2;
            const ry = size.y / 2;
            parts.push(
              `<ellipse cx="${abs.x}" cy="${abs.y}" rx="${rx}" ry="${ry}" stroke="${color}" fill="${color}" />`,
            );
            break;
          }
          default:
            parts.push(
              this.svgCircle(abs.x, abs.y, Math.max(size.x, size.y) / 2, color, color),
            );
        }

        // Drill hole
        const drill: number | undefined = (pad as any).drill;
        if (drill && drill > 0) {
          parts.push(
            this.svgCircle(abs.x, abs.y, drill / 2, '#1a1a2e', '#1a1a2e'),
          );
        }
      }

      // Silkscreen lines (if silk layer is selected)
      const silkLines: any[] = (fp as any).silkscreenLines ?? [];
      for (const line of silkLines) {
        const s = rotatePoint(
          new Vector2D(fpPos.x + line.start.x, fpPos.y + line.start.y),
          fpPos,
          fpRot,
        );
        const e = rotatePoint(
          new Vector2D(fpPos.x + line.end.x, fpPos.y + line.end.y),
          fpPos,
          fpRot,
        );
        parts.push(this.svgLine(s.x, s.y, e.x, e.y, '#c8c832', 0.15));
      }

      // Reference text
      const ref: string = (fp as any).reference ?? '';
      if (ref) {
        parts.push(this.svgText(ref, fpPos.x, fpPos.y - 1.5, 1.2, '#c8c832'));
      }
    }

    parts.push(this.svgFooter());
    return parts.join('\n');
  }

  /* ================================================================ */
  /*  SVG primitives                                                   */
  /* ================================================================ */

  private svgHeader(
    width: number,
    height: number,
    viewBox: string,
  ): string {
    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}">`,
    ].join('\n');
  }

  private svgLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    stroke: string,
    width: number,
  ): string {
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" />`;
  }

  private svgCircle(
    cx: number,
    cy: number,
    r: number,
    stroke: string,
    fill: string,
  ): string {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" stroke="${stroke}" stroke-width="0.1" fill="${fill}" />`;
  }

  private svgRect(
    x: number,
    y: number,
    w: number,
    h: number,
    stroke: string,
    fill: string,
  ): string {
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" stroke="${stroke}" stroke-width="0.1" fill="${fill}" />`;
  }

  private svgPolygon(
    points: Vector2D[],
    stroke: string,
    fill: string,
  ): string {
    const pts = points.map((p) => `${p.x},${p.y}`).join(' ');
    return `<polygon points="${pts}" stroke="${stroke}" stroke-width="0.1" fill="${fill}" />`;
  }

  private svgText(
    text: string,
    x: number,
    y: number,
    fontSize: number,
    fill: string = '#000000',
  ): string {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<text x="${x}" y="${y}" font-size="${fontSize}" font-family="monospace" fill="${fill}">${escaped}</text>`;
  }

  private svgPath(
    d: string,
    stroke: string,
    fill: string,
  ): string {
    return `<path d="${d}" stroke="${stroke}" stroke-width="0.2" fill="${fill}" />`;
  }

  private svgFooter(): string {
    return '</svg>';
  }
}
