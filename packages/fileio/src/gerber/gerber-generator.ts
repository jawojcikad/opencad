import {
  PCBDocument,
  Layer,
  Track,
  Via,
  Pad,
  CopperZone,
  BoardOutline,
  Footprint,
  Vector2D,
} from '@opencad/core';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface GerberAperture {
  code: number; // D10, D11, …
  type: 'circle' | 'rectangle' | 'obround' | 'polygon';
  parameters: number[]; // diameter, width×height, etc. (mm)
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Rotate a point around the origin by `angleDeg` degrees. */
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

/* ------------------------------------------------------------------ */
/*  GerberGenerator                                                    */
/* ------------------------------------------------------------------ */

/**
 * Generates Gerber RS‑274X files from a `PCBDocument`.
 *
 * Co‑ordinate format: **2.6** (mm, 6 decimal places, leading‑zero
 * suppression, absolute co‑ordinates).
 *
 * Aperture codes start at D10 as per the spec.
 */
export class GerberGenerator {
  private apertures: GerberAperture[] = [];
  private commands: string[] = [];
  private apertureIndex = 10; // D10 is the first user aperture

  constructor() {
    this.reset();
  }

  /* ================================================================ */
  /*  Public API                                                       */
  /* ================================================================ */

  /**
   * Generate *all* standard Gerber fabrication files for the given PCB.
   *
   * Returns a `Map<string, string>` where the key is the suggested
   * filename and the value is the full Gerber file content.
   */
  generateAll(document: PCBDocument): Map<string, string> {
    const files = new Map<string, string>();

    const layers: Layer[] = (document as any).layers ?? [];
    for (const layer of layers) {
      const name = (layer as any).name ?? '';
      const lowerName = name.toLowerCase();

      if (lowerName.includes('cu') || lowerName.includes('copper')) {
        files.set(
          `${this.sanitiseFilename(name)}.gtl`,
          this.generateCopperLayer(document, layer),
        );
      } else if (lowerName.includes('silk')) {
        files.set(
          `${this.sanitiseFilename(name)}.gto`,
          this.generateSilkscreen(document, layer),
        );
      } else if (lowerName.includes('mask')) {
        files.set(
          `${this.sanitiseFilename(name)}.gts`,
          this.generateSolderMask(document, layer),
        );
      } else if (lowerName.includes('paste')) {
        files.set(
          `${this.sanitiseFilename(name)}.gtp`,
          this.generatePasteMask(document, layer),
        );
      }
    }

    files.set('board_outline.gm1', this.generateBoardOutline(document));
    return files;
  }

  /* -------- Layer generators -------------------------------------- */

  generateCopperLayer(document: PCBDocument, layer: Layer): string {
    this.reset();
    const layerName = (layer as any).name ?? 'Copper';
    const layerId = (layer as any).id ?? layerName;

    this.commands.push(this.header(layerName, 'positive'));

    // Tracks
    const tracks: Track[] = (document as any).tracks ?? [];
    for (const track of tracks) {
      const tLayer = (track as any).layer ?? '';
      if (tLayer === layerId || tLayer === layerName) {
        this.renderTrack(track);
      }
    }

    // Vias (appear on all copper layers)
    const vias: Via[] = (document as any).vias ?? [];
    for (const via of vias) {
      const viaLayers: string[] = (via as any).layers ?? [];
      if (
        viaLayers.length === 0 ||
        viaLayers.includes(layerId) ||
        viaLayers.includes(layerName)
      ) {
        this.renderVia(via);
      }
    }

    // Footprint pads on this layer
    const footprints: Footprint[] = (document as any).footprints ?? [];
    for (const fp of footprints) {
      const pads: Pad[] = (fp as any).pads ?? [];
      const fpPos: Vector2D = (fp as any).position ?? { x: 0, y: 0 };
      const fpRot: number = (fp as any).rotation ?? 0;
      for (const pad of pads) {
        const padLayers: string[] = (pad as any).layers ?? [];
        if (
          padLayers.length === 0 ||
          padLayers.includes(layerId) ||
          padLayers.includes(layerName)
        ) {
          this.renderPad(pad, fpPos, fpRot);
        }
      }
    }

    // Copper zones
    const zones: CopperZone[] = (document as any).zones ?? [];
    for (const zone of zones) {
      const zLayer = (zone as any).layer ?? '';
      if (zLayer === layerId || zLayer === layerName) {
        this.renderZone(zone);
      }
    }

    this.commands.push(this.footer());
    return this.commands.join('\n');
  }

  generateSilkscreen(document: PCBDocument, layer: Layer): string {
    this.reset();
    const layerName = (layer as any).name ?? 'Silkscreen';
    this.commands.push(this.header(layerName, 'positive'));

    // Render footprint outlines / silkscreen lines
    const footprints: Footprint[] = (document as any).footprints ?? [];
    const lineAp = this.addAperture({ code: 0, type: 'circle', parameters: [0.15] });

    for (const fp of footprints) {
      const fpLayer = (fp as any).layer ?? '';
      const fpLayerName = (layer as any).name ?? '';
      // Match front silk to front footprints, back to back
      const isFront = fpLayerName.toLowerCase().includes('front') || fpLayerName.toLowerCase().includes('f.');
      const fpIsFront = fpLayer.toLowerCase().includes('front') || fpLayer.toLowerCase().includes('f.') || fpLayer.toLowerCase().includes('top');
      if (isFront !== fpIsFront && fpLayer !== '') continue;

      const fpPos: Vector2D = (fp as any).position ?? { x: 0, y: 0 };
      const fpRot: number = (fp as any).rotation ?? 0;
      const silkLines: any[] = (fp as any).silkscreenLines ?? [];

      this.commands.push(this.selectAperture(lineAp));
      for (const line of silkLines) {
        const start = rotatePoint(
          new Vector2D(line.start.x + fpPos.x, line.start.y + fpPos.y),
          fpPos,
          fpRot,
        );
        const end = rotatePoint(
          new Vector2D(line.end.x + fpPos.x, line.end.y + fpPos.y),
          fpPos,
          fpRot,
        );
        this.commands.push(this.moveTo(start.x, start.y));
        this.commands.push(this.lineTo(end.x, end.y));
      }

      // Reference designator as text (simplified: flash at centre)
      const ref: string = (fp as any).reference ?? '';
      if (ref) {
        this.commands.push(this.flash(fpPos.x, fpPos.y));
      }
    }

    this.commands.push(this.footer());
    return this.commands.join('\n');
  }

  generateSolderMask(document: PCBDocument, layer: Layer): string {
    this.reset();
    const layerName = (layer as any).name ?? 'SolderMask';
    // Solder mask is *negative*: openings where pads are
    this.commands.push(this.header(layerName, 'negative'));

    const footprints: Footprint[] = (document as any).footprints ?? [];
    const layerId = (layer as any).id ?? layerName;

    for (const fp of footprints) {
      const fpPos: Vector2D = (fp as any).position ?? { x: 0, y: 0 };
      const fpRot: number = (fp as any).rotation ?? 0;
      const pads: Pad[] = (fp as any).pads ?? [];
      for (const pad of pads) {
        const padLayers: string[] = (pad as any).layers ?? [];
        if (
          padLayers.length === 0 ||
          padLayers.includes(layerId) ||
          padLayers.includes(layerName) ||
          padLayers.some((l: string) => l.toLowerCase().includes('mask'))
        ) {
          // Expand pad slightly for mask opening
          this.renderPad(pad, fpPos, fpRot, 0.1);
        }
      }
    }

    // Via mask openings
    const vias: Via[] = (document as any).vias ?? [];
    for (const via of vias) {
      this.renderVia(via, 0.1);
    }

    this.commands.push(this.footer());
    return this.commands.join('\n');
  }

  generatePasteMask(document: PCBDocument, layer: Layer): string {
    this.reset();
    const layerName = (layer as any).name ?? 'PasteMask';
    this.commands.push(this.header(layerName, 'positive'));

    const footprints: Footprint[] = (document as any).footprints ?? [];
    const layerId = (layer as any).id ?? layerName;

    for (const fp of footprints) {
      const fpPos: Vector2D = (fp as any).position ?? { x: 0, y: 0 };
      const fpRot: number = (fp as any).rotation ?? 0;
      const pads: Pad[] = (fp as any).pads ?? [];
      for (const pad of pads) {
        // Only SMD pads get paste
        const padDrill: number | undefined = (pad as any).drill;
        if (padDrill && padDrill > 0) continue;

        const padLayers: string[] = (pad as any).layers ?? [];
        if (
          padLayers.length === 0 ||
          padLayers.includes(layerId) ||
          padLayers.includes(layerName) ||
          padLayers.some((l: string) => l.toLowerCase().includes('paste'))
        ) {
          this.renderPad(pad, fpPos, fpRot, -0.05); // slight inset for paste
        }
      }
    }

    this.commands.push(this.footer());
    return this.commands.join('\n');
  }

  generateBoardOutline(document: PCBDocument): string {
    this.reset();
    this.commands.push(this.header('BoardOutline', 'positive'));

    const outline: BoardOutline | undefined = (document as any).boardOutline;
    if (outline) {
      this.renderOutline(outline);
    }

    this.commands.push(this.footer());
    return this.commands.join('\n');
  }

  /* ================================================================ */
  /*  RS‑274X Primitives                                               */
  /* ================================================================ */

  private header(
    layerName: string,
    polarity: 'positive' | 'negative',
  ): string {
    const lp = polarity === 'positive' ? '%LPD*%' : '%LPC*%';
    return [
      'G04 Generated by OpenCAD*',
      `G04 Layer: ${layerName}*`,
      '%MOMM*%', // metric (mm)
      '%FSLAX26Y26*%', // format: leading‑zero suppression, absolute, 2.6
      '%TF.GenerationSoftware,OpenCAD,1.0.0*%',
      `%TF.FileFunction,${layerName}*%`,
      lp,
    ].join('\n');
  }

  private footer(): string {
    return 'M02*';
  }

  private defineAperture(aperture: GerberAperture): string {
    const code = `D${aperture.code}`;
    switch (aperture.type) {
      case 'circle': {
        const d = aperture.parameters[0];
        return `%ADD${aperture.code}C,${d.toFixed(6)}*%`;
      }
      case 'rectangle': {
        const w = aperture.parameters[0];
        const h = aperture.parameters[1] ?? w;
        return `%ADD${aperture.code}R,${w.toFixed(6)}X${h.toFixed(6)}*%`;
      }
      case 'obround': {
        const w = aperture.parameters[0];
        const h = aperture.parameters[1] ?? w;
        return `%ADD${aperture.code}O,${w.toFixed(6)}X${h.toFixed(6)}*%`;
      }
      case 'polygon': {
        const od = aperture.parameters[0]; // outer diameter
        const n = aperture.parameters[1] ?? 4; // num vertices
        const rot = aperture.parameters[2] ?? 0;
        return `%ADD${aperture.code}P,${od.toFixed(6)}X${n}X${rot.toFixed(6)}*%`;
      }
      default:
        return `%ADD${aperture.code}C,0.100000*%`;
    }
  }

  private selectAperture(code: number): string {
    return `D${code}*`;
  }

  /** Move without drawing (D02). */
  private moveTo(x: number, y: number): string {
    return `X${this.formatCoord(x)}Y${this.formatCoord(y)}D02*`;
  }

  /** Draw line to (D01). */
  private lineTo(x: number, y: number): string {
    return `X${this.formatCoord(x)}Y${this.formatCoord(y)}D01*`;
  }

  /** Flash aperture at position (D03). */
  private flash(x: number, y: number): string {
    return `X${this.formatCoord(x)}Y${this.formatCoord(y)}D03*`;
  }

  /** Layer polarity. */
  private setPolarity(dark: boolean): string {
    return dark ? '%LPD*%' : '%LPC*%';
  }

  /** Start region fill (G36). */
  private regionStart(): string {
    return 'G36*';
  }

  /** End region fill (G37). */
  private regionEnd(): string {
    return 'G37*';
  }

  /**
   * Format a co‑ordinate value (mm) into Gerber 2.6 integer format.
   *
   * The 2.6 format means 2 integer digits and 6 fractional digits with
   * *leading‑zero suppression*.  The value is in mm so we multiply by
   * 10^6 to get the integer representation.
   */
  private formatCoord(value: number): string {
    const intVal = Math.round(value * 1_000_000);
    // Leading-zero suppression: just output the integer, negative sign preserved
    return intVal.toString();
  }

  /* ================================================================ */
  /*  Render helpers                                                   */
  /* ================================================================ */

  private renderTrack(track: Track): void {
    const width: number = (track as any).width ?? 0.25;
    const start: Vector2D = (track as any).start ?? { x: 0, y: 0 };
    const end: Vector2D = (track as any).end ?? { x: 0, y: 0 };

    const apCode = this.addAperture({
      code: 0,
      type: 'circle',
      parameters: [width],
    });

    this.commands.push(this.selectAperture(apCode));
    this.commands.push(this.moveTo(start.x, start.y));
    this.commands.push(this.lineTo(end.x, end.y));
  }

  private renderPad(
    pad: Pad,
    footprintPos: Vector2D,
    footprintRot: number,
    expansion: number = 0,
  ): void {
    const padPos: Vector2D = (pad as any).position ?? { x: 0, y: 0 };
    const padSize: Vector2D = (pad as any).size ?? { x: 1, y: 1 };
    const padShape: string = (pad as any).shape ?? 'circle';

    // Absolute pad position (local + footprint origin, rotated)
    const local: Vector2D = new Vector2D(
      footprintPos.x + padPos.x,
      footprintPos.y + padPos.y,
    );
    const abs = rotatePoint(local, footprintPos, footprintRot);

    const w = padSize.x + expansion * 2;
    const h = padSize.y + expansion * 2;

    let apType: GerberAperture['type'];
    let params: number[];

    switch (padShape) {
      case 'rect':
      case 'rectangle':
        apType = 'rectangle';
        params = [w, h];
        break;
      case 'obround':
      case 'oval':
        apType = 'obround';
        params = [w, h];
        break;
      case 'polygon':
        apType = 'polygon';
        params = [Math.max(w, h), (pad as any).polygonSides ?? 4, 0];
        break;
      case 'circle':
      default:
        apType = 'circle';
        params = [Math.max(w, h)];
        break;
    }

    const apCode = this.addAperture({
      code: 0,
      type: apType,
      parameters: params,
    });

    this.commands.push(this.selectAperture(apCode));
    this.commands.push(this.flash(abs.x, abs.y));
  }

  private renderVia(via: Via, expansion: number = 0): void {
    const pos: Vector2D = (via as any).position ?? { x: 0, y: 0 };
    const diameter: number = (via as any).diameter ?? 0.6;

    const apCode = this.addAperture({
      code: 0,
      type: 'circle',
      parameters: [diameter + expansion * 2],
    });

    this.commands.push(this.selectAperture(apCode));
    this.commands.push(this.flash(pos.x, pos.y));
  }

  private renderZone(zone: CopperZone): void {
    const outline: Vector2D[] = (zone as any).outline ?? [];
    if (outline.length < 3) return;

    // Use a minimal aperture for region fills
    const apCode = this.addAperture({
      code: 0,
      type: 'circle',
      parameters: [0.01],
    });

    this.commands.push(this.selectAperture(apCode));
    this.commands.push(this.setPolarity(true));
    this.commands.push(this.regionStart());

    this.commands.push(this.moveTo(outline[0].x, outline[0].y));
    for (let i = 1; i < outline.length; i++) {
      this.commands.push(this.lineTo(outline[i].x, outline[i].y));
    }
    // Close the polygon
    this.commands.push(this.lineTo(outline[0].x, outline[0].y));

    this.commands.push(this.regionEnd());
  }

  private renderOutline(outline: BoardOutline): void {
    const vertices: Vector2D[] = (outline as any).vertices ?? [];
    if (vertices.length < 2) return;

    // Board outline is typically drawn with a thin line
    const apCode = this.addAperture({
      code: 0,
      type: 'circle',
      parameters: [0.1],
    });

    this.commands.push(this.selectAperture(apCode));
    this.commands.push(this.moveTo(vertices[0].x, vertices[0].y));
    for (let i = 1; i < vertices.length; i++) {
      this.commands.push(this.lineTo(vertices[i].x, vertices[i].y));
    }
    // Close
    this.commands.push(this.lineTo(vertices[0].x, vertices[0].y));
  }

  /* ================================================================ */
  /*  Internal utilities                                               */
  /* ================================================================ */

  /**
   * Register an aperture (or return the code of an existing identical
   * one) and emit the `%ADD…%` definition into the command list.
   */
  private addAperture(
    template: Omit<GerberAperture, 'code'> & { code?: number },
  ): number {
    // See if we already have an identical aperture
    for (const existing of this.apertures) {
      if (
        existing.type === template.type &&
        existing.parameters.length === template.parameters.length &&
        existing.parameters.every(
          (v, i) => Math.abs(v - template.parameters[i]) < 1e-9,
        )
      ) {
        return existing.code;
      }
    }

    const code = this.apertureIndex++;
    const aperture: GerberAperture = {
      code,
      type: template.type,
      parameters: [...template.parameters],
    };
    this.apertures.push(aperture);
    this.commands.push(this.defineAperture(aperture));
    return code;
  }

  private reset(): void {
    this.apertures = [];
    this.commands = [];
    this.apertureIndex = 10;
  }

  private sanitiseFilename(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9_\-.]/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
  }
}
