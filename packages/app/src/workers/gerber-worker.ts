// ---------------------------------------------------------------------------
// OpenCAD — Gerber Generation Worker
// ---------------------------------------------------------------------------
// Generates Gerber RS-274X files from PCB data in a background thread.
// ---------------------------------------------------------------------------

export interface Vec2 {
  x: number;
  y: number;
}

export interface PadDef {
  id: string;
  net: string;
  position: Vec2;
  size: Vec2;
  shape: string;
  type: string;
  drill?: number;
}

export interface FootprintDef {
  id: string;
  reference: string;
  position: Vec2;
  rotation: number;
  layer: string;
  pads: PadDef[];
  silkscreen: { lines: { x1: number; y1: number; x2: number; y2: number }[] };
}

export interface Track {
  id: string;
  net: string;
  layer: string;
  width: number;
  points: Vec2[];
}

export interface Via {
  id: string;
  net: string;
  position: Vec2;
  diameter: number;
  drill: number;
}

export interface BoardOutline {
  points: Vec2[];
}

export interface PCBDocument {
  boardOutline: BoardOutline;
  footprints: FootprintDef[];
  tracks: Track[];
  vias: Via[];
  layers: string[];
}

export interface GerberFile {
  filename: string;
  content: string;
}

// ---------------------------------------------------------------------------
// Gerber RS-274X formatting helpers
// ---------------------------------------------------------------------------

/** Convert mm to Gerber coordinate (integer, 4.6 format → units = mm × 1e6) */
function coord(mm: number): string {
  return Math.round(mm * 1_000_000).toString();
}

function gerberHeader(layerName: string): string {
  const lines = [
    `G04 OpenCAD Gerber Export*`,
    `G04 Layer: ${layerName}*`,
    `%FSLAX46Y46*%`,       // Format: Leading zeros omitted, Absolute, 4.6
    `%MOMM*%`,             // Units: millimeters
    `%TF.GenerationSoftware,OpenCAD,0.1.0*%`,
    `%TF.CreationDate,${new Date().toISOString()}*%`,
    `%TF.FileFunction,${layerName}*%`,
  ];
  return lines.join('\n') + '\n';
}

function gerberFooter(): string {
  return 'M02*\n'; // End of file
}

// ---------------------------------------------------------------------------
// Aperture management
// ---------------------------------------------------------------------------

interface Aperture {
  code: number;
  type: 'C' | 'R' | 'O'; // Circle, Rectangle, Oval
  params: number[];
}

class ApertureTable {
  private apertures: Aperture[] = [];
  private nextCode = 10; // D10 is the first user aperture

  getOrCreate(type: 'C' | 'R' | 'O', params: number[]): number {
    // Look for existing
    for (const a of this.apertures) {
      if (a.type === type && a.params.length === params.length) {
        let match = true;
        for (let i = 0; i < params.length; i++) {
          if (Math.abs(a.params[i] - params[i]) > 0.0001) {
            match = false;
            break;
          }
        }
        if (match) return a.code;
      }
    }

    const code = this.nextCode++;
    this.apertures.push({ code, type, params });
    return code;
  }

  toGerber(): string {
    return this.apertures
      .map((a) => {
        const paramStr = a.params.map((p) => p.toFixed(4)).join('X');
        return `%ADD${a.code}${a.type},${paramStr}*%`;
      })
      .join('\n') + '\n';
  }
}

// ---------------------------------------------------------------------------
// Layer generators
// ---------------------------------------------------------------------------

function generateCopperLayer(
  layerName: string,
  footprints: FootprintDef[],
  tracks: Track[],
  vias: Via[],
): string {
  const apt = new ApertureTable();
  const commands: string[] = [];

  // Collect tracks for this layer
  const layerTracks = tracks.filter((t) => t.layer === layerName);

  // Draw tracks
  for (const track of layerTracks) {
    const dCode = apt.getOrCreate('C', [track.width]);
    commands.push(`D${dCode}*`);
    for (let i = 0; i < track.points.length; i++) {
      const p = track.points[i];
      const op = i === 0 ? 'D02' : 'D01'; // D02 = move, D01 = draw
      commands.push(`X${coord(p.x)}Y${coord(p.y)}${op}*`);
    }
  }

  // Draw pads for footprints on this layer
  for (const fp of footprints) {
    if (fp.layer !== layerName && layerName !== 'F.Cu' && layerName !== 'B.Cu') continue;
    // Only draw pads for the matching layer, or through-hole pads on both copper layers
    for (const pad of fp.pads) {
      const isThisLayer = fp.layer === layerName || pad.type === 'through-hole';
      if (!isThisLayer) continue;

      const absX = fp.position.x + pad.position.x;
      const absY = fp.position.y + pad.position.y;

      let dCode: number;
      if (pad.shape === 'circle') {
        dCode = apt.getOrCreate('C', [Math.max(pad.size.x, pad.size.y)]);
      } else if (pad.shape === 'oval') {
        dCode = apt.getOrCreate('O', [pad.size.x, pad.size.y]);
      } else {
        dCode = apt.getOrCreate('R', [pad.size.x, pad.size.y]);
      }

      commands.push(`D${dCode}*`);
      commands.push(`X${coord(absX)}Y${coord(absY)}D03*`); // D03 = flash
    }
  }

  // Draw vias on all copper layers
  for (const via of vias) {
    const dCode = apt.getOrCreate('C', [via.diameter]);
    commands.push(`D${dCode}*`);
    commands.push(`X${coord(via.position.x)}Y${coord(via.position.y)}D03*`);
  }

  return gerberHeader(layerName) + apt.toGerber() + commands.join('\n') + '\n' + gerberFooter();
}

function generateSilkscreen(
  layerName: string,
  footprints: FootprintDef[],
): string {
  const apt = new ApertureTable();
  const commands: string[] = [];
  const lineWidth = 0.15; // mm

  const side = layerName.startsWith('F') ? 'F.Cu' : 'B.Cu';

  for (const fp of footprints) {
    if (fp.layer !== side) continue;
    const dCode = apt.getOrCreate('C', [lineWidth]);
    commands.push(`D${dCode}*`);

    for (const line of fp.silkscreen.lines) {
      const x1 = fp.position.x + line.x1;
      const y1 = fp.position.y + line.y1;
      const x2 = fp.position.x + line.x2;
      const y2 = fp.position.y + line.y2;
      commands.push(`X${coord(x1)}Y${coord(y1)}D02*`);
      commands.push(`X${coord(x2)}Y${coord(y2)}D01*`);
    }
  }

  return gerberHeader(layerName) + apt.toGerber() + commands.join('\n') + '\n' + gerberFooter();
}

function generateBoardOutline(outline: BoardOutline): string {
  const apt = new ApertureTable();
  const dCode = apt.getOrCreate('C', [0.1]); // thin line
  const commands: string[] = [];

  commands.push(`D${dCode}*`);

  const pts = outline.points;
  if (pts.length > 0) {
    commands.push(`X${coord(pts[0].x)}Y${coord(pts[0].y)}D02*`);
    for (let i = 1; i < pts.length; i++) {
      commands.push(`X${coord(pts[i].x)}Y${coord(pts[i].y)}D01*`);
    }
    // Close the outline
    commands.push(`X${coord(pts[0].x)}Y${coord(pts[0].y)}D01*`);
  }

  return gerberHeader('Edge.Cuts') + apt.toGerber() + commands.join('\n') + '\n' + gerberFooter();
}

function generateExcellonDrill(
  footprints: FootprintDef[],
  vias: Via[],
): string {
  const lines: string[] = [
    '; OpenCAD Excellon Drill File',
    'M48',
    'METRIC,TZ',
  ];

  // Collect all drill sizes
  const drills = new Map<number, Vec2[]>();

  for (const fp of footprints) {
    for (const pad of fp.pads) {
      if (pad.type === 'through-hole' && pad.drill) {
        const absPos: Vec2 = {
          x: fp.position.x + pad.position.x,
          y: fp.position.y + pad.position.y,
        };
        let list = drills.get(pad.drill);
        if (!list) {
          list = [];
          drills.set(pad.drill, list);
        }
        list.push(absPos);
      }
    }
  }

  for (const via of vias) {
    let list = drills.get(via.drill);
    if (!list) {
      list = [];
      drills.set(via.drill, list);
    }
    list.push(via.position);
  }

  // Define tools
  let toolNum = 1;
  const toolMap = new Map<number, number>();
  for (const [size] of drills) {
    lines.push(`T${toolNum}C${size.toFixed(3)}`);
    toolMap.set(size, toolNum);
    toolNum++;
  }

  lines.push('%'); // End of header

  // Drill hits
  for (const [size, positions] of drills) {
    const tn = toolMap.get(size)!;
    lines.push(`T${tn}`);
    for (const pos of positions) {
      lines.push(`X${(pos.x * 1000).toFixed(0)}Y${(pos.y * 1000).toFixed(0)}`);
    }
  }

  lines.push('M30'); // End of program
  return lines.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// Worker message handler
// ---------------------------------------------------------------------------

declare const self: DedicatedWorkerGlobalScope;

self.onmessage = (e: MessageEvent<{ document: PCBDocument }>) => {
  const { document: pcbDoc } = e.data;

  console.log('[Gerber Worker] Generating Gerber files…');

  const gerberFiles: GerberFile[] = [];

  // Copper layers
  const copperLayers = pcbDoc.layers.filter((l) => l.endsWith('.Cu'));
  for (const layer of copperLayers) {
    const suffix = layer.replace('.', '_');
    gerberFiles.push({
      filename: `OpenCAD_${suffix}.gbr`,
      content: generateCopperLayer(layer, pcbDoc.footprints, pcbDoc.tracks, pcbDoc.vias),
    });
  }

  // Silkscreen
  gerberFiles.push({
    filename: 'OpenCAD_F_SilkS.gbr',
    content: generateSilkscreen('F.SilkS', pcbDoc.footprints),
  });
  gerberFiles.push({
    filename: 'OpenCAD_B_SilkS.gbr',
    content: generateSilkscreen('B.SilkS', pcbDoc.footprints),
  });

  // Board outline
  gerberFiles.push({
    filename: 'OpenCAD_Edge_Cuts.gbr',
    content: generateBoardOutline(pcbDoc.boardOutline),
  });

  // Drill file
  gerberFiles.push({
    filename: 'OpenCAD.drl',
    content: generateExcellonDrill(pcbDoc.footprints, pcbDoc.vias),
  });

  console.log(`[Gerber Worker] Generated ${gerberFiles.length} files.`);

  self.postMessage({ files: gerberFiles });
};
