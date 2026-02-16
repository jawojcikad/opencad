/**
 * Eagle XML format parser for .brd and .sch files.
 *
 * Produces the same runtime shapes as the KiCad parser so that
 * PCBEditor, Viewer3DCanvas, and SchematicEditor can consume them
 * without any changes.
 *
 * Coordinates:  Eagle XML stores everything in mm (same as OpenCAD runtime).
 * Rotation:     Eagle uses "R90", "MR270" strings → we emit degrees (number).
 * Layers:       Eagle numbering (1=Top, 16=Bottom, 20=Dimension, …) is mapped
 *               to KiCad-style layer names (F.Cu, B.Cu, Edge.Cuts, …) so that
 *               downstream renderers work unchanged.
 */

// ─── Tiny DOM helpers (no external dep) ─────────────────────────────

interface MiniElement {
  tag: string;
  attrs: Record<string, string>;
  children: MiniElement[];
  text: string;
}

function parseXML(xml: string): MiniElement {
  // Minimal non-validating XML parser sufficient for Eagle files.
  // Handles self-closing tags, attributes, CDATA, comments, DOCTYPE, PI.
  const root: MiniElement = { tag: '#root', attrs: {}, children: [], text: '' };
  const stack: MiniElement[] = [root];
  let i = 0;
  const len = xml.length;

  while (i < len) {
    const openBracket = xml.indexOf('<', i);
    if (openBracket === -1) {
      // Remaining text
      stack[stack.length - 1].text += xml.slice(i);
      break;
    }

    // Text before tag
    if (openBracket > i) {
      stack[stack.length - 1].text += xml.slice(i, openBracket);
    }

    // Skip comments, CDATA, DOCTYPE, PI
    if (xml.startsWith('<!--', openBracket)) {
      i = xml.indexOf('-->', openBracket + 4);
      i = i === -1 ? len : i + 3;
      continue;
    }
    if (xml.startsWith('<![CDATA[', openBracket)) {
      const cdEnd = xml.indexOf(']]>', openBracket + 9);
      if (cdEnd !== -1) {
        stack[stack.length - 1].text += xml.slice(openBracket + 9, cdEnd);
        i = cdEnd + 3;
      } else {
        i = len;
      }
      continue;
    }
    if (xml.startsWith('<!', openBracket)) {
      i = xml.indexOf('>', openBracket + 2);
      i = i === -1 ? len : i + 1;
      continue;
    }
    if (xml.startsWith('<?', openBracket)) {
      i = xml.indexOf('?>', openBracket + 2);
      i = i === -1 ? len : i + 2;
      continue;
    }

    const closeBracket = xml.indexOf('>', openBracket + 1);
    if (closeBracket === -1) {
      i = len;
      continue;
    }

    const tagContent = xml.slice(openBracket + 1, closeBracket);

    // Closing tag
    if (tagContent.startsWith('/')) {
      if (stack.length > 1) stack.pop();
      i = closeBracket + 1;
      continue;
    }

    const selfClosing = tagContent.endsWith('/');
    const raw = selfClosing ? tagContent.slice(0, -1).trim() : tagContent.trim();
    const spaceIdx = raw.search(/\s/);
    const tag = spaceIdx === -1 ? raw : raw.slice(0, spaceIdx);
    const attrStr = spaceIdx === -1 ? '' : raw.slice(spaceIdx + 1);

    const attrs: Record<string, string> = {};
    const attrRe = /([a-zA-Z_][\w\-.:]*)\s*=\s*"([^"]*)"/g;
    let m: RegExpExecArray | null;
    while ((m = attrRe.exec(attrStr)) !== null) {
      attrs[m[1]] = decodeEntities(m[2]);
    }

    const el: MiniElement = { tag, attrs, children: [], text: '' };
    stack[stack.length - 1].children.push(el);

    if (!selfClosing) {
      stack.push(el);
    }

    i = closeBracket + 1;
  }

  return root;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function findChild(el: MiniElement, tag: string): MiniElement | undefined {
  return el.children.find((c) => c.tag === tag);
}

function findAll(el: MiniElement, tag: string): MiniElement[] {
  return el.children.filter((c) => c.tag === tag);
}

function num(el: MiniElement, attr: string, fallback = 0): number {
  const v = el.attrs[attr];
  if (v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function str(el: MiniElement, attr: string, fallback = ''): string {
  return el.attrs[attr] ?? fallback;
}

// ─── Rotation parsing ───────────────────────────────────────────────

interface EagleRot {
  degrees: number;
  mirrored: boolean;
}

function parseRot(rot: string | undefined): EagleRot {
  if (!rot) return { degrees: 0, mirrored: false };
  let mirrored = false;
  let rest = rot;
  if (rest.startsWith('M')) {
    mirrored = true;
    rest = rest.slice(1);
  }
  if (rest.startsWith('S')) rest = rest.slice(1); // spin prefix (rare)
  if (rest.startsWith('R')) rest = rest.slice(1);
  const degrees = Number(rest) || 0;
  return { degrees, mirrored };
}

// ─── Eagle layer → KiCad-style layer name mapping ───────────────────

const EAGLE_LAYER_MAP: Record<number, string> = {
  1: 'F.Cu',
  2: 'In1.Cu',
  3: 'In2.Cu',
  15: 'In3.Cu',
  16: 'B.Cu',
  17: 'F.Cu',    // Pads — mapped to copper
  18: 'F.Cu',    // Vias — mapped to copper
  20: 'Edge.Cuts',
  21: 'F.SilkS',
  22: 'B.SilkS',
  25: 'F.SilkS', // tNames
  26: 'B.SilkS', // bNames
  27: 'F.Fab',   // tValues
  28: 'B.Fab',   // bValues
  29: 'F.Mask',
  30: 'B.Mask',
  31: 'F.Paste',
  32: 'B.Paste',
  39: 'F.CrtYd',
  40: 'B.CrtYd',
  41: 'F.CrtYd', // tRestrict
  42: 'B.CrtYd', // bRestrict
  44: 'Edge.Cuts',
  45: 'Edge.Cuts',
  46: 'Edge.Cuts', // Milling
  51: 'F.Fab',
  52: 'B.Fab',
};

function eagleLayerToKiCad(layerNum: number): string {
  return EAGLE_LAYER_MAP[layerNum] ?? `User.${layerNum}`;
}

function layerForSmd(layerNum: number): string {
  return layerNum === 1 ? 'F.Cu' : layerNum === 16 ? 'B.Cu' : eagleLayerToKiCad(layerNum);
}

function smdLayers(layerNum: number): string[] {
  if (layerNum === 1) return ['F.Cu', 'F.Paste', 'F.Mask'];
  if (layerNum === 16) return ['B.Cu', 'B.Paste', 'B.Mask'];
  return [eagleLayerToKiCad(layerNum)];
}

function componentSide(rot: EagleRot): string {
  return rot.mirrored ? 'B.Cu' : 'F.Cu';
}

// ─── Eagle PCB Parser ───────────────────────────────────────────────

export class EaglePCBParser {
  parse(xmlContent: string): any {
    const doc = parseXML(xmlContent);
    const eagle = findChild(doc, 'eagle');
    if (!eagle) throw new Error('Not a valid Eagle XML file: missing <eagle> root');
    const drawing = findChild(eagle, 'drawing');
    if (!drawing) throw new Error('Missing <drawing> element');
    const board = findChild(drawing, 'board');
    if (!board) throw new Error('Missing <board> element — not a board file');

    // 1. Parse package library (footprint definitions)
    const packageDefs = this.parsePackageLibraries(board);

    // 2. Parse elements (placed components) → footprints
    const footprints = this.parseElements(board, packageDefs);

    // 3. Parse signals → tracks, vias, copper zones
    const { tracks, vias, copperZones } = this.parseSignals(board);

    // 4. Parse board outline from <plain> wires on layer 20
    const boardOutline = this.parseBoardOutline(board);

    // 5. Layer stack
    const layers = this.parseLayers(drawing);

    return {
      layers,
      tracks,
      vias,
      footprints,
      zones: copperZones,
      copperZones,
      nets: [],
      boardOutline,
      designRules: {
        minTraceWidth: 0.2,
        minClearance: 0.2,
        minViaDiameter: 0.6,
        minViaDrill: 0.3,
      },
    };
  }

  private parseLayers(drawing: MiniElement): any[] {
    const layersEl = findChild(drawing, 'layers');
    if (!layersEl) return [];
    return findAll(layersEl, 'layer').map((l) => ({
      id: str(l, 'number'),
      name: str(l, 'name'),
      type: 'signal',
    }));
  }

  // ── Package library parsing ──────────────────────────────────────

  private parsePackageLibraries(board: MiniElement): Map<string, MiniElement> {
    const map = new Map<string, MiniElement>();
    const libs = findChild(board, 'libraries');
    if (!libs) return map;

    for (const lib of findAll(libs, 'library')) {
      const libName = str(lib, 'name');
      const packages = findChild(lib, 'packages');
      if (!packages) continue;
      for (const pkg of findAll(packages, 'package')) {
        const pkgName = str(pkg, 'name');
        map.set(`${libName}::${pkgName}`, pkg);
      }
    }
    return map;
  }

  // ── Element → Footprint conversion ───────────────────────────────

  private parseElements(
    board: MiniElement,
    packageDefs: Map<string, MiniElement>,
  ): any[] {
    const elements = findChild(board, 'elements');
    if (!elements) return [];

    return findAll(elements, 'element').map((el) => {
      const ref = str(el, 'name');
      const lib = str(el, 'library');
      const pkg = str(el, 'package');
      const value = str(el, 'value');
      const x = num(el, 'x');
      const y = num(el, 'y');
      const rot = parseRot(el.attrs['rot']);

      const pkgDef = packageDefs.get(`${lib}::${pkg}`);
      const pads = pkgDef ? this.parsePadsFromPackage(pkgDef, rot) : [];
      const silkscreen = pkgDef ? this.parseSilkscreenFromPackage(pkgDef) : [];

      return {
        id: `${ref}_${pkg}`,
        name: `${lib}:${pkg}`,
        reference: ref,
        value,
        position: { x, y },
        rotation: rot.degrees,
        layer: componentSide(rot),
        footprintName: pkg,
        pads,
        silkscreen,
      };
    });
  }

  private parsePadsFromPackage(pkg: MiniElement, compRot: EagleRot): any[] {
    const pads: any[] = [];
    let padIdx = 0;

    // SMD pads
    for (const smd of findAll(pkg, 'smd')) {
      const padName = str(smd, 'name');
      const x = num(smd, 'x');
      const y = num(smd, 'y');
      const dx = num(smd, 'dx');
      const dy = num(smd, 'dy');
      const smdRot = parseRot(smd.attrs['rot']);
      const layerNum = Number(smd.attrs['layer'] ?? '1');
      const effectiveLayer = compRot.mirrored
        ? (layerNum === 1 ? 16 : layerNum === 16 ? 1 : layerNum)
        : layerNum;

      pads.push({
        id: `pad-${padIdx++}`,
        number: padName,
        position: { x, y },
        size: { x: dx, y: dy },
        width: dx,
        height: dy,
        shape: dx === dy ? 'circle' : 'rect',
        type: 'smd',
        layer: layerForSmd(effectiveLayer),
        layers: smdLayers(effectiveLayer),
        rotation: smdRot.degrees,
      });
    }

    // Through-hole pads
    for (const pad of findAll(pkg, 'pad')) {
      const padName = str(pad, 'name');
      const x = num(pad, 'x');
      const y = num(pad, 'y');
      const drill = num(pad, 'drill');
      const diameter = num(pad, 'diameter', drill * 1.8);
      const shapeAttr = str(pad, 'shape', 'round');

      let shape: string;
      switch (shapeAttr) {
        case 'square': shape = 'rect'; break;
        case 'long': shape = 'oval'; break;
        case 'octagon': shape = 'rect'; break; // approximate
        case 'offset': shape = 'oval'; break;
        default: shape = 'circle';
      }

      const size = shapeAttr === 'long' || shapeAttr === 'offset'
        ? { x: diameter * 2, y: diameter }
        : { x: diameter, y: diameter };

      pads.push({
        id: `pad-${padIdx++}`,
        number: padName,
        position: { x, y },
        size,
        width: size.x,
        height: size.y,
        shape,
        type: 'through_hole',
        drill,
        plated: true,
        layer: 'F.Cu',
        layers: ['F.Cu', 'B.Cu', '*.Cu', 'F.Mask', 'B.Mask'],
        rotation: 0,
      });
    }

    // Non-plated holes
    for (const hole of findAll(pkg, 'hole')) {
      const x = num(hole, 'x');
      const y = num(hole, 'y');
      const drill = num(hole, 'drill');

      pads.push({
        id: `pad-${padIdx++}`,
        number: '',
        position: { x, y },
        size: { x: drill, y: drill },
        width: drill,
        height: drill,
        shape: 'circle',
        type: 'npth',
        drill,
        plated: false,
        layer: 'F.Cu',
        layers: ['F.Cu', 'B.Cu'],
        rotation: 0,
      });
    }

    return pads;
  }

  private parseSilkscreenFromPackage(pkg: MiniElement): any[] {
    const result: any[] = [];

    for (const wire of findAll(pkg, 'wire')) {
      const layerNum = Number(wire.attrs['layer'] ?? '0');
      if (layerNum !== 21 && layerNum !== 22 && layerNum !== 51 && layerNum !== 52) continue;
      result.push({
        type: 'line',
        x1: num(wire, 'x1'),
        y1: num(wire, 'y1'),
        x2: num(wire, 'x2'),
        y2: num(wire, 'y2'),
        width: num(wire, 'width', 0.15),
        layer: eagleLayerToKiCad(layerNum),
      });
    }

    for (const text of findAll(pkg, 'text')) {
      const layerNum = Number(text.attrs['layer'] ?? '0');
      if (layerNum !== 21 && layerNum !== 22 && layerNum !== 25 && layerNum !== 26) continue;
      const t = text.text.replace(/&gt;/g, '>').trim();
      if (!t) continue;
      result.push({
        type: 'text',
        text: t,
        position: { x: num(text, 'x'), y: num(text, 'y') },
        size: num(text, 'size', 1.27),
        layer: eagleLayerToKiCad(layerNum),
      });
    }

    return result;
  }

  // ── Signal parsing: tracks, vias, copper zones ───────────────────

  private parseSignals(board: MiniElement): {
    tracks: any[];
    vias: any[];
    copperZones: any[];
  } {
    const tracks: any[] = [];
    const vias: any[] = [];
    const copperZones: any[] = [];

    const signals = findChild(board, 'signals');
    if (!signals) return { tracks, vias, copperZones };

    for (const signal of findAll(signals, 'signal')) {
      const netName = str(signal, 'name');

      for (const wire of findAll(signal, 'wire')) {
        const layerNum = Number(wire.attrs['layer'] ?? '0');
        if (layerNum === 19) continue; // unrouted (ratsnest) — skip
        tracks.push({
          start: { x: num(wire, 'x1'), y: num(wire, 'y1') },
          end: { x: num(wire, 'x2'), y: num(wire, 'y2') },
          width: num(wire, 'width', 0.25),
          layer: eagleLayerToKiCad(layerNum),
          net: netName,
        });
      }

      for (const via of findAll(signal, 'via')) {
        const x = num(via, 'x');
        const y = num(via, 'y');
        const drill = num(via, 'drill', 0.3);
        const diameter = num(via, 'diameter', drill * 2);
        const extent = str(via, 'extent', '1-16');
        const layerNums = extent.split('-').map(Number);
        const layers = layerNums.map((n) => eagleLayerToKiCad(n));

        vias.push({
          position: { x, y },
          diameter,
          drill,
          layers,
          net: netName,
        });
      }

      for (const poly of findAll(signal, 'polygon')) {
        const layerNum = Number(poly.attrs['layer'] ?? '0');
        const vertices = findAll(poly, 'vertex').map((v) => ({
          x: num(v, 'x'),
          y: num(v, 'y'),
        }));
        if (vertices.length < 3) continue;

        copperZones.push({
          polygon: vertices,
          filledPolygon: vertices,
          layer: eagleLayerToKiCad(layerNum),
          net: netName,
        });
      }
    }

    return { tracks, vias, copperZones };
  }

  // ── Board outline ────────────────────────────────────────────────

  private parseBoardOutline(board: MiniElement): any {
    const plain = findChild(board, 'plain');
    if (!plain) return { polygon: [], points: [] };

    // Collect wires on layer 20 (Dimension = board outline)
    const outlineSegments: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    for (const wire of findAll(plain, 'wire')) {
      const layerNum = Number(wire.attrs['layer'] ?? '0');
      if (layerNum !== 20) continue;
      outlineSegments.push({
        x1: num(wire, 'x1'),
        y1: num(wire, 'y1'),
        x2: num(wire, 'x2'),
        y2: num(wire, 'y2'),
      });
    }

    if (outlineSegments.length === 0) {
      return { polygon: [], points: [] };
    }

    // Chain segments into a polygon (greedy nearest-endpoint)
    const polygon = this.chainSegments(outlineSegments);

    return { polygon, points: polygon };
  }

  private chainSegments(
    segments: Array<{ x1: number; y1: number; x2: number; y2: number }>,
  ): Array<{ x: number; y: number }> {
    if (segments.length === 0) return [];

    const eps = 0.01; // 10μm tolerance
    const used = new Array(segments.length).fill(false);
    const result: Array<{ x: number; y: number }> = [];

    // Start with first segment
    used[0] = true;
    result.push({ x: segments[0].x1, y: segments[0].y1 });
    result.push({ x: segments[0].x2, y: segments[0].y2 });

    let changed = true;
    while (changed) {
      changed = false;
      const tail = result[result.length - 1];

      for (let i = 0; i < segments.length; i++) {
        if (used[i]) continue;
        const s = segments[i];

        if (Math.abs(s.x1 - tail.x) < eps && Math.abs(s.y1 - tail.y) < eps) {
          result.push({ x: s.x2, y: s.y2 });
          used[i] = true;
          changed = true;
        } else if (Math.abs(s.x2 - tail.x) < eps && Math.abs(s.y2 - tail.y) < eps) {
          result.push({ x: s.x1, y: s.y1 });
          used[i] = true;
          changed = true;
        }
      }
    }

    return result;
  }
}

// ─── Eagle Schematic Parser ─────────────────────────────────────────

export class EagleSchematicParser {
  parse(xmlContent: string): any {
    const doc = parseXML(xmlContent);
    const eagle = findChild(doc, 'eagle');
    if (!eagle) throw new Error('Not a valid Eagle XML file: missing <eagle> root');
    const drawing = findChild(eagle, 'drawing');
    if (!drawing) throw new Error('Missing <drawing> element');
    const schematic = findChild(drawing, 'schematic');
    if (!schematic) throw new Error('Missing <schematic> element — not a schematic file');

    // Parse symbol library
    const symbolDefs = this.parseSymbolLibraries(schematic);
    const deviceSetDefs = this.parseDeviceSetLibraries(schematic);

    // Parse parts (component instances)
    const partDefs = this.parseParts(schematic);

    // Parse sheets
    const sheets = this.parseSheets(schematic, partDefs, symbolDefs, deviceSetDefs);

    return {
      title: 'Eagle Schematic',
      sheets,
    };
  }

  // ── Symbol library parsing ───────────────────────────────────────

  private parseSymbolLibraries(
    schematic: MiniElement,
  ): Map<string, MiniElement> {
    const map = new Map<string, MiniElement>();
    const libs = findChild(schematic, 'libraries');
    if (!libs) return map;

    for (const lib of findAll(libs, 'library')) {
      const libName = str(lib, 'name');
      const symbols = findChild(lib, 'symbols');
      if (!symbols) continue;
      for (const sym of findAll(symbols, 'symbol')) {
        map.set(`${libName}::${str(sym, 'name')}`, sym);
      }
    }
    return map;
  }

  private parseDeviceSetLibraries(
    schematic: MiniElement,
  ): Map<string, { symbolName: string; prefix: string }> {
    const map = new Map<string, { symbolName: string; prefix: string }>();
    const libs = findChild(schematic, 'libraries');
    if (!libs) return map;

    for (const lib of findAll(libs, 'library')) {
      const libName = str(lib, 'name');
      const devicesets = findChild(lib, 'devicesets');
      if (!devicesets) continue;

      for (const ds of findAll(devicesets, 'deviceset')) {
        const dsName = str(ds, 'name');
        const prefix = str(ds, 'prefix', 'U');
        const gates = findChild(ds, 'gates');
        // Build a map from gate name to symbol name
        if (gates) {
          for (const gate of findAll(gates, 'gate')) {
            const gateName = str(gate, 'name');
            const symName = str(gate, 'symbol');
            map.set(`${libName}::${dsName}::${gateName}`, { symbolName: `${libName}::${symName}`, prefix });
          }
        }
      }
    }
    return map;
  }

  // ── Parts ────────────────────────────────────────────────────────

  private parseParts(
    schematic: MiniElement,
  ): Map<string, { library: string; deviceset: string; device: string; value: string }> {
    const map = new Map<string, { library: string; deviceset: string; device: string; value: string }>();
    const partsEl = findChild(schematic, 'parts');
    if (!partsEl) return map;

    for (const part of findAll(partsEl, 'part')) {
      map.set(str(part, 'name'), {
        library: str(part, 'library'),
        deviceset: str(part, 'deviceset'),
        device: str(part, 'device'),
        value: str(part, 'value'),
      });
    }
    return map;
  }

  // ── Sheet parsing ────────────────────────────────────────────────

  private parseSheets(
    schematic: MiniElement,
    partDefs: Map<string, { library: string; deviceset: string; device: string; value: string }>,
    symbolDefs: Map<string, MiniElement>,
    deviceSetDefs: Map<string, { symbolName: string; prefix: string }>,
  ): any[] {
    const sheetsEl = findChild(schematic, 'sheets');
    if (!sheetsEl) return [];

    return findAll(sheetsEl, 'sheet').map((sheet, sheetIdx) => {
      const components = this.parseInstances(sheet, partDefs, symbolDefs, deviceSetDefs);
      const { wires, netLabels, junctions } = this.parseNets(sheet);
      const busWires = this.parseBusses(sheet);

      return {
        name: `Sheet${sheetIdx + 1}`,
        components,
        wires: [...wires, ...busWires],
        netLabels,
        powerPorts: [],
        junctions,
        buses: [],
        busEntries: [],
        hierarchicalSheets: [],
        width: 420,   // A3 default (common for Eagle schematics)
        height: 297,
      };
    });
  }

  private parseInstances(
    sheet: MiniElement,
    partDefs: Map<string, { library: string; deviceset: string; device: string; value: string }>,
    symbolDefs: Map<string, MiniElement>,
    deviceSetDefs: Map<string, { symbolName: string; prefix: string }>,
  ): any[] {
    const instancesEl = findChild(sheet, 'instances');
    if (!instancesEl) return [];

    return findAll(instancesEl, 'instance').map((inst) => {
      const partName = str(inst, 'part');
      const gateName = str(inst, 'gate');
      const x = num(inst, 'x');
      const y = num(inst, 'y');
      const rot = parseRot(inst.attrs['rot']);

      const partDef = partDefs.get(partName);
      const lib = partDef?.library ?? '';
      const ds = partDef?.deviceset ?? '';
      const value = partDef?.value ?? ds;

      // Resolve symbol through gate → deviceset → symbol lookup
      const gateKey = `${lib}::${ds}::${gateName}`;
      const gateInfo = deviceSetDefs.get(gateKey);
      const symbolKey = gateInfo?.symbolName ?? '';
      const symbolEl = symbolDefs.get(symbolKey);

      const symbol = symbolEl
        ? this.buildSymbol(symbolEl, symbolKey)
        : { id: ds, name: ds, pins: [], lines: [], arcs: [], rectangles: [], circles: [], texts: [] };

      return {
        id: `${partName}_${ds}`,
        reference: partName,
        value,
        position: { x, y },
        rotation: rot.degrees,
        mirrored: rot.mirrored,
        symbol,
        properties: {},
      };
    });
  }

  private buildSymbol(sym: MiniElement, id: string): any {
    const pins: any[] = [];
    const lines: any[] = [];
    const arcs: any[] = [];
    const rectangles: any[] = [];
    const circles: any[] = [];
    const texts: any[] = [];

    for (const pin of findAll(sym, 'pin')) {
      const pinRot = parseRot(pin.attrs['rot']);
      const length = str(pin, 'length', 'short');
      const lengthMM = length === 'point' ? 0 : length === 'short' ? 2.54 : length === 'middle' ? 5.08 : 7.62;

      pins.push({
        name: str(pin, 'name'),
        number: str(pin, 'name'),
        position: { x: num(pin, 'x'), y: num(pin, 'y') },
        length: lengthMM,
        rotation: pinRot.degrees,
        electricalType: str(pin, 'direction', 'passive'),
      });
    }

    for (const wire of findAll(sym, 'wire')) {
      const layerNum = Number(wire.attrs['layer'] ?? '0');
      if (layerNum !== 94) continue; // only symbol body outlines
      lines.push({
        start: { x: num(wire, 'x1'), y: num(wire, 'y1') },
        end: { x: num(wire, 'x2'), y: num(wire, 'y2') },
        strokeWidth: num(wire, 'width', 0.254),
      });
    }

    for (const rect of findAll(sym, 'rectangle')) {
      rectangles.push({
        topLeft: { x: num(rect, 'x1'), y: num(rect, 'y1') },
        bottomRight: { x: num(rect, 'x2'), y: num(rect, 'y2') },
        strokeWidth: 1,
        filled: false,
      });
    }

    for (const circ of findAll(sym, 'circle')) {
      circles.push({
        center: { x: num(circ, 'x'), y: num(circ, 'y') },
        radius: num(circ, 'radius'),
        strokeWidth: num(circ, 'width', 0.254),
      });
    }

    for (const text of findAll(sym, 'text')) {
      const layerNum = Number(text.attrs['layer'] ?? '0');
      if (layerNum !== 94 && layerNum !== 95 && layerNum !== 96) continue;
      const t = text.text.replace(/&gt;/g, '>').trim();
      if (!t) continue;
      texts.push({
        position: { x: num(text, 'x'), y: num(text, 'y') },
        text: t,
        fontSize: num(text, 'size', 1.778),
        rotation: 0,
        visible: true,
      });
    }

    return { id, name: id, pins, lines, arcs, rectangles, circles, texts };
  }

  // ── Net parsing ──────────────────────────────────────────────────

  private parseNets(sheet: MiniElement): {
    wires: any[];
    netLabels: any[];
    junctions: any[];
  } {
    const wires: any[] = [];
    const netLabels: any[] = [];
    const junctions: any[] = [];

    const netsEl = findChild(sheet, 'nets');
    if (!netsEl) return { wires, netLabels, junctions };

    for (const net of findAll(netsEl, 'net')) {
      const netName = str(net, 'name');

      for (const segment of findAll(net, 'segment')) {
        // Each segment is a connected group of wires
        const segWires = findAll(segment, 'wire');
        if (segWires.length > 0) {
          // Chain segment wires into polylines
          const chainedPoints = this.chainNetWires(segWires);
          for (const pts of chainedPoints) {
            wires.push({ points: pts });
          }
        }

        for (const label of findAll(segment, 'label')) {
          netLabels.push({
            name: netName,
            position: { x: num(label, 'x'), y: num(label, 'y') },
            rotation: parseRot(label.attrs['rot']).degrees,
          });
        }

        for (const junc of findAll(segment, 'junction')) {
          junctions.push({
            position: { x: num(junc, 'x'), y: num(junc, 'y') },
          });
        }
      }
    }

    return { wires, netLabels, junctions };
  }

  private chainNetWires(wireEls: MiniElement[]): Array<Array<{ x: number; y: number }>> {
    // Each wire element is a line segment. Chain connected ones into polylines.
    const segments = wireEls.map((w) => ({
      x1: num(w, 'x1'), y1: num(w, 'y1'),
      x2: num(w, 'x2'), y2: num(w, 'y2'),
    }));

    if (segments.length === 0) return [];
    if (segments.length === 1) {
      return [[
        { x: segments[0].x1, y: segments[0].y1 },
        { x: segments[0].x2, y: segments[0].y2 },
      ]];
    }

    // Simple greedy chain
    const eps = 0.01;
    const used = new Array(segments.length).fill(false);
    const polylines: Array<Array<{ x: number; y: number }>> = [];

    for (let start = 0; start < segments.length; start++) {
      if (used[start]) continue;
      used[start] = true;

      const pts: Array<{ x: number; y: number }> = [
        { x: segments[start].x1, y: segments[start].y1 },
        { x: segments[start].x2, y: segments[start].y2 },
      ];

      let changed = true;
      while (changed) {
        changed = false;
        const tail = pts[pts.length - 1];
        for (let j = 0; j < segments.length; j++) {
          if (used[j]) continue;
          const s = segments[j];
          if (Math.abs(s.x1 - tail.x) < eps && Math.abs(s.y1 - tail.y) < eps) {
            pts.push({ x: s.x2, y: s.y2 });
            used[j] = true;
            changed = true;
          } else if (Math.abs(s.x2 - tail.x) < eps && Math.abs(s.y2 - tail.y) < eps) {
            pts.push({ x: s.x1, y: s.y1 });
            used[j] = true;
            changed = true;
          }
        }
      }

      polylines.push(pts);
    }

    return polylines;
  }

  // ── Bus parsing ──────────────────────────────────────────────────

  private parseBusses(sheet: MiniElement): any[] {
    const wires: any[] = [];
    const bussesEl = findChild(sheet, 'busses');
    if (!bussesEl) return wires;

    for (const bus of findAll(bussesEl, 'bus')) {
      for (const segment of findAll(bus, 'segment')) {
        for (const wire of findAll(segment, 'wire')) {
          wires.push({
            points: [
              { x: num(wire, 'x1'), y: num(wire, 'y1') },
              { x: num(wire, 'x2'), y: num(wire, 'y2') },
            ],
          });
        }
      }
    }

    return wires;
  }
}
