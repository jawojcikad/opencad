import { Vector2D } from '@opencad/core';

const PACKAGE_SIZE_TOKENS = new Set([
  '0201', '0402', '0603', '0805', '1206', '1210', '1812', '1825', '2010', '2012', '2512', '3216', '3225', '5025', '6332',
]);

const POWER_NET_PREFIXES = ['GND', 'VCC', 'VDD', 'VSS', 'VIN', 'VBAT', '3V3', '5V', '1V8', '2V5', 'PWR', 'USB', 'ETH'];

function extractPrintableRuns(content: string): string[] {
  const runs: string[] = [];
  let current = '';

  for (let index = 0; index < content.length; index++) {
    const code = content.charCodeAt(index);
    if (code >= 32 && code <= 126) {
      current += content[index];
    } else {
      if (current.length >= 2) runs.push(current);
      current = '';
    }
  }

  if (current.length >= 2) runs.push(current);
  return runs;
}

function isLikelyReference(token: string): boolean {
  if (!/^[A-Z]{1,4}\d{1,4}$/.test(token)) return false;

  const prefixMatch = token.match(/^([A-Z]{1,4})(\d{1,4})$/);
  if (!prefixMatch) return false;
  const prefix = prefixMatch[1];
  const digits = prefixMatch[2];

  if ((prefix === 'C' || prefix === 'R' || prefix === 'L') && PACKAGE_SIZE_TOKENS.has(digits)) {
    return false;
  }

  return true;
}

function collectReferences(runs: string[]): string[] {
  const refs = new Set<string>();

  for (const run of runs) {
    const tokens = run.match(/[A-Z0-9_]{2,20}/g) ?? [];
    for (const token of tokens) {
      if (isLikelyReference(token)) refs.add(token);
    }
  }

  return Array.from(refs).sort((left, right) => left.localeCompare(right)).slice(0, 400);
}

function collectNetNames(runs: string[]): string[] {
  const nets = new Set<string>();

  for (const run of runs) {
    const tokens = run.match(/[A-Z0-9_\-]{2,32}/g) ?? [];
    for (const token of tokens) {
      if (!/[A-Z]/.test(token)) continue;
      if (token.length < 2 || token.length > 24) continue;
      if (!POWER_NET_PREFIXES.some((prefix) => token.startsWith(prefix))) continue;
      nets.add(token);
    }
  }

  return Array.from(nets).sort((left, right) => left.localeCompare(right)).slice(0, 120);
}

function gridPosition(index: number, step = 10, perRow = 20): Vector2D {
  const col = index % perRow;
  const row = Math.floor(index / perRow);
  return new Vector2D(col * step, row * step);
}

export class EagleBinarySchematicParser {
  parse(content: string, fileName = 'legacy-binary.sch'): any {
    const runs = extractPrintableRuns(content);
    const references = collectReferences(runs);
    const netNames = collectNetNames(runs);

    const components = references.map((reference, index) => ({
      id: `legacy_${reference}`,
      componentId: 'legacy-eagle:component',
      symbolId: 'legacy-eagle:component',
      reference,
      value: '',
      position: gridPosition(index, 10, 20),
      rotation: 0,
      mirrored: false,
      pinNetMap: {},
      symbol: { id: 'legacy-eagle:component', name: 'Legacy Eagle Component', pins: [] },
      properties: { source: 'legacy-eagle-binary-approximate' },
    }));

    const netLabels = netNames.map((name, index) => ({
      id: `legacy_net_${name}`,
      name,
      text: name,
      netId: name,
      position: new Vector2D(-20, index * 6),
      rotation: 0,
    }));

    return {
      id: `legacy-eagle-sch-${fileName}`,
      name: fileName,
      title: `${fileName} (Approximate Import)`,
      metadata: {
        approximateImport: true,
        sourceFormat: 'eagle-binary',
        extractedReferences: components.length,
        extractedNetLabels: netLabels.length,
      },
      sheets: [
        {
          id: 'sheet1',
          name: 'Sheet1',
          components,
          wires: [],
          netLabels,
          powerPorts: [],
          junctions: [],
          buses: [],
          busEntries: [],
          hierarchicalSheets: [],
          width: 420,
          height: 297,
        },
      ],
    };
  }
}

export class EagleBinaryPCBParser {
  parse(content: string, fileName = 'legacy-binary.brd'): any {
    const runs = extractPrintableRuns(content);
    const references = collectReferences(runs);

    const footprints = references.map((reference, index) => {
      const position = gridPosition(index, 4, 30);
      return {
        id: `legacy_fp_${reference}`,
        name: reference,
        reference,
        value: '',
        footprintName: 'LEGACY_PLACEHOLDER',
        position,
        rotation: 0,
        layer: 'F.Cu',
        pads: [
          {
            id: `legacy_pad_${reference}`,
            number: '1',
            type: 'smd',
            shape: 'rect',
            position: new Vector2D(0, 0),
            size: new Vector2D(1, 1),
            width: 1,
            height: 1,
            rotation: 0,
            layer: 'F.Cu',
            layers: ['F.Cu', 'F.Mask', 'F.Paste'],
          },
        ],
        lines: [],
        arcs: [],
        circles: [],
        texts: [],
        courtyard: [],
      };
    });

    const boardWidth = Math.max(80, Math.ceil(Math.sqrt(Math.max(1, footprints.length))) * 8);
    const boardHeight = Math.max(60, Math.ceil(footprints.length / Math.max(1, boardWidth / 8)) * 8);
    const boardOutline = [
      new Vector2D(0, 0),
      new Vector2D(boardWidth, 0),
      new Vector2D(boardWidth, boardHeight),
      new Vector2D(0, boardHeight),
    ];

    return {
      id: `legacy-eagle-brd-${fileName}`,
      name: fileName,
      metadata: {
        approximateImport: true,
        sourceFormat: 'eagle-binary',
        extractedFootprints: footprints.length,
      },
      footprints,
      tracks: [],
      vias: [],
      zones: [],
      copperZones: [],
      nets: [],
      boardOutline: {
        polygon: boardOutline,
        points: boardOutline,
        vertices: boardOutline,
      },
    };
  }
}
