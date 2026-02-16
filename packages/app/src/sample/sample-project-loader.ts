// ---------------------------------------------------------------------------
// OpenCAD — Sample Project Loader
// ---------------------------------------------------------------------------
// Converts sample project data (project-manager types) into @opencad/core
// types that the SchematicEditor and PCBEditor can consume.
// ---------------------------------------------------------------------------

import {
  Vector2D,
  generateId,
  type UUID,
  type SchematicDocument,
  type Sheet,
  type Wire as CoreWire,
  type NetLabel as CoreNetLabel,
  type PowerPort as CorePowerPort,
  type SchematicComponent as CoreSchematicComponent,
  type Symbol as CoreSymbol,
  type SymbolLine,
  type SymbolRectangle,
  type SymbolCircle,
  type SymbolText,
  type Pin as CorePin,
  PinType,
  PinShape,
} from '@opencad/core';

import { createSampleProject } from './sample-project';

import type {
  SchematicComponent as SampleComponent,
  PinDef,
} from '../project/project-manager';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a lookup map from net name → UUID so that all references to the same
 * net share a single id.
 */
function buildNetMap(netNames: Iterable<string>): Map<string, UUID> {
  const map = new Map<string, UUID>();
  for (const name of netNames) {
    if (name && !map.has(name)) {
      map.set(name, generateId());
    }
  }
  return map;
}

function mapPinType(t: PinDef['type']): PinType {
  switch (t) {
    case 'input':
      return PinType.Input;
    case 'output':
      return PinType.Output;
    case 'bidirectional':
      return PinType.Bidirectional;
    case 'passive':
      return PinType.Passive;
    case 'power':
      return PinType.PowerInput;
    default:
      return PinType.Unspecified;
  }
}

// ---------------------------------------------------------------------------
// 1. Schematic loader
// ---------------------------------------------------------------------------

export function loadSampleSchematic(): SchematicDocument {
  const project = createSampleProject();
  const sheet = project.schematic.sheets[0];

  // Collect every net name used across wires, net-labels, and power-ports.
  const allNetNames = new Set<string>();
  for (const w of sheet.wires) allNetNames.add(w.net);
  for (const nl of sheet.netLabels) allNetNames.add(nl.net);
  for (const pp of sheet.powerPorts) allNetNames.add(pp.net);

  const netMap = buildNetMap(allNetNames);

  // --- Convert wires ---
  const wires: CoreWire[] = sheet.wires.map((w) => ({
    id: w.id,
    points: w.points.map((p) => new Vector2D(p.x, p.y)),
    netId: netMap.get(w.net),
  }));

  // --- Convert net labels ---
  const netLabels: CoreNetLabel[] = sheet.netLabels.map((nl) => ({
    id: nl.id,
    position: new Vector2D(nl.position.x, nl.position.y),
    rotation: 0,
    text: nl.net,
    netId: netMap.get(nl.net)!,
  }));

  // --- Convert power ports ---
  const powerPorts: CorePowerPort[] = sheet.powerPorts.map((pp) => ({
    id: pp.id,
    position: new Vector2D(pp.position.x, pp.position.y),
    rotation: 0,
    name: pp.net,
    netId: netMap.get(pp.net)!,
    style: pp.type === 'vcc' ? ('arrow' as const) : ('bar' as const),
  }));

  // --- Convert components ---
  const components: (CoreSchematicComponent & { symbol?: CoreSymbol })[] =
    sheet.components.map((comp) => {
      const symbol = convertSymbol(comp);
      const coreComp: CoreSchematicComponent & { symbol?: CoreSymbol } = {
        id: comp.id,
        componentId: comp.id, // use component's own id as componentId
        symbolId: comp.symbolId,
        reference: comp.reference,
        value: comp.value,
        position: new Vector2D(comp.position.x, comp.position.y),
        rotation: comp.rotation,
        pinNetMap: {},
        mirrored: false,
        symbol,
      };
      return coreComp;
    });

  // --- Assemble sheet ---
  const coreSheet: Sheet = {
    id: sheet.id,
    name: sheet.name,
    components: components as CoreSchematicComponent[],
    wires,
    netLabels,
    powerPorts,
    junctions: [],
    buses: [],
    busEntries: [],
    hierarchicalSheets: [],
  };

  return {
    id: generateId(),
    name: '555 Timer LED Blinker',
    sheets: [coreSheet],
  };
}

// ---------------------------------------------------------------------------
// Symbol conversion (sample SymbolGraphics → core Symbol)
// ---------------------------------------------------------------------------

function convertSymbol(comp: SampleComponent): CoreSymbol {
  const g = comp.graphics;

  const lines: SymbolLine[] = (g.lines ?? []).map((l) => ({
    start: new Vector2D(l.x1, l.y1),
    end: new Vector2D(l.x2, l.y2),
    strokeWidth: 1,
  }));

  const rectangles: SymbolRectangle[] = (g.rects ?? []).map((r) => ({
    topLeft: new Vector2D(r.x, r.y),
    bottomRight: new Vector2D(r.x + r.w, r.y + r.h),
    strokeWidth: 1,
    filled: false,
  }));

  const circles: SymbolCircle[] = (g.circles ?? []).map((c) => ({
    center: new Vector2D(c.cx, c.cy),
    radius: c.r,
    strokeWidth: 1,
    filled: false,
  }));

  const texts: SymbolText[] = (g.texts ?? []).map((t) => ({
    position: new Vector2D(t.x, t.y),
    text: t.text,
    fontSize: t.size,
    rotation: 0,
    visible: true,
  }));

  const pins: CorePin[] = (comp.pins ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    number: p.number,
    type: mapPinType(p.type),
    shape: PinShape.Line,
    position: new Vector2D(p.position.x, p.position.y),
    length: 10,
    orientation: p.orientation,
  }));

  return {
    id: comp.symbolId,
    name: comp.symbolId,
    pins,
    lines,
    arcs: [],
    rectangles,
    circles,
    texts,
  };
}

// ---------------------------------------------------------------------------
// 2. PCB loader
// ---------------------------------------------------------------------------

/**
 * Returns a plain object matching the runtime shape the PCBEditor reads:
 *   - `boardOutline.points` (not `polygon`)
 *   - `copperZones` (not `zones`)
 *   - `nets` array
 *   - footprints with `reference`, `layer`, `silkscreen`, and pads with
 *     `width`, `height`, `layer`, `shape`, `number`.
 */
export function loadSamplePCB(): any {
  const project = createSampleProject();
  const pcb = project.pcb;

  // Collect unique net names from all pads
  const netNames = new Set<string>();
  for (const fp of pcb.footprints) {
    for (const p of fp.pads) {
      if (p.net) netNames.add(p.net);
    }
  }

  const netMap = buildNetMap(netNames);

  // Build nets array
  const nets = Array.from(netMap.entries()).map(([name, id]) => ({
    id,
    name,
    pins: [] as string[],
  }));

  // Convert footprints
  const footprints = pcb.footprints.map((fp) => ({
    id: fp.id,
    name: fp.reference,
    reference: fp.reference,
    value: fp.value,
    position: new Vector2D(fp.position.x, fp.position.y),
    rotation: fp.rotation,
    layer: fp.layer,
    componentId: fp.componentId,
    pads: fp.pads.map((p) => ({
      id: p.id,
      number: p.id,
      position: new Vector2D(p.position.x, p.position.y),
      width: p.size.x,
      height: p.size.y,
      shape: p.shape,
      type: p.type,
      layer: fp.layer,
      netId: p.net ? netMap.get(p.net) : undefined,
      drill: p.drill,
    })),
    silkscreen: fp.silkscreen.lines.map((l) => ({
      type: 'line' as const,
      layer: 'F.SilkS',
      start: new Vector2D(l.x1, l.y1),
      end: new Vector2D(l.x2, l.y2),
    })),
    lines: [] as any[],
    arcs: [] as any[],
    circles: [] as any[],
    texts: [] as any[],
    courtyard: [] as any[],
  }));

  // Board outline — use `points` for PCBEditor runtime compat
  const boardOutline = {
    points: pcb.boardOutline.points.map(
      (p) => new Vector2D(p.x, p.y),
    ),
  };

  return {
    id: generateId(),
    name: '555 Timer PCB',
    footprints,
    tracks: [],
    vias: [],
    copperZones: [],
    boardOutline,
    nets,
  };
}
