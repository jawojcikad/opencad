import { Vector2D } from '../math/vector2d';
import { generateId } from './base';
import {
  Layer,
  PadShape,
  PadType,
  type PCBDocument,
  type Footprint,
  type Track,
  type Via,
  type CopperZone,
} from './pcb-types';
import { type Net } from './net';

const toNumber = (value: unknown, fallback = 0): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const toPoint = (point: unknown): Vector2D => {
  if (point instanceof Vector2D) return point;

  const obj = (point ?? {}) as { x?: unknown; y?: unknown };
  return new Vector2D(toNumber(obj.x, 0), toNumber(obj.y, 0));
};

const toLayer = (layer: unknown, fallback: Layer): Layer => {
  if (typeof layer === 'string') return layer as Layer;
  return fallback;
};

export function normalizePCBDocument(doc: unknown): PCBDocument {
  if (!doc || typeof doc !== 'object') {
    throw new Error('Cannot normalize null or undefined PCB document');
  }

  const raw = doc as Record<string, any>;

  const footprints: Footprint[] = (raw.footprints ?? []).map((fp: any) => {
    const fpLayer = toLayer(fp.layer ?? fp.layers?.[0], Layer.FCu);

    const pads = (fp.pads ?? []).map((pad: any) => {
      const width = toNumber(pad.width ?? pad.size?.x, 1);
      const height = toNumber(pad.height ?? pad.size?.y, width);
      const layers = Array.isArray(pad.layers) && pad.layers.length
        ? pad.layers.map((layer: unknown) => toLayer(layer, fpLayer))
        : [toLayer(pad.layer, fpLayer)];

      return {
        ...pad,
        id: pad.id ?? generateId(),
        number: String(pad.number ?? pad.name ?? ''),
        type: (pad.type ?? PadType.SMD) as PadType,
        shape: (pad.shape ?? PadShape.Rect) as PadShape,
        position: toPoint(pad.position),
        size: toPoint(pad.size ?? { x: width, y: height }),
        width,
        height,
        layer: toLayer(pad.layer, layers[0] ?? fpLayer),
        layers,
        rotation: toNumber(pad.rotation, 0),
        drill: pad.drill !== undefined ? toNumber(pad.drill, 0) : undefined,
      };
    });

    return {
      ...fp,
      id: fp.id ?? generateId(),
      name: fp.name ?? fp.reference ?? fp.footprintName ?? 'Footprint',
      reference: fp.reference ?? fp.name ?? '',
      position: toPoint(fp.position),
      rotation: toNumber(fp.rotation, 0),
      layer: fpLayer,
      pads,
      lines: fp.lines ?? [],
      arcs: fp.arcs ?? [],
      circles: fp.circles ?? [],
      texts: fp.texts ?? [],
      courtyard: (fp.courtyard ?? []).map((point: unknown) => toPoint(point)),
      silkscreen: fp.silkscreen ?? [],
    };
  });

  const tracks: Track[] = (raw.tracks ?? []).map((track: any) => ({
    ...track,
    id: track.id ?? generateId(),
    start: toPoint(track.start),
    end: toPoint(track.end),
    width: toNumber(track.width, 0.2),
    layer: toLayer(track.layer, Layer.FCu),
  }));

  const vias: Via[] = (raw.vias ?? []).map((via: any) => ({
    ...via,
    id: via.id ?? generateId(),
    position: toPoint(via.position),
    diameter: toNumber(via.diameter ?? via.size, 0.8),
    drill: toNumber(via.drill ?? via.drillDiameter, 0.4),
    layers: (Array.isArray(via.layers) && via.layers.length === 2)
      ? [toLayer(via.layers[0], Layer.FCu), toLayer(via.layers[1], Layer.BCu)]
      : [Layer.FCu, Layer.BCu],
  }));

  const zones: CopperZone[] = (raw.copperZones ?? raw.zones ?? []).map((zone: any) => ({
    ...zone,
    id: zone.id ?? generateId(),
    polygon: (zone.polygon ?? zone.outline ?? []).map((point: unknown) => toPoint(point)),
    filledPolygon: (zone.filledPolygon ?? zone.polygon ?? zone.outline ?? []).map((point: unknown) => toPoint(point)),
    layer: toLayer(zone.layer, Layer.FCu),
    fillSettings: {
      filled: zone.fillSettings?.filled ?? true,
      thermalGap: toNumber(zone.fillSettings?.thermalGap, 0.2),
      thermalBridgeWidth: toNumber(zone.fillSettings?.thermalBridgeWidth, 0.25),
      fillType: zone.fillSettings?.fillType ?? 'solid',
      hatchWidth: zone.fillSettings?.hatchWidth,
      hatchGap: zone.fillSettings?.hatchGap,
      priority: toNumber(zone.fillSettings?.priority, 0),
    },
  }));

  const boardPoints = (
    raw.boardOutline?.points ??
    raw.boardOutline?.polygon ??
    raw.boardOutline?.vertices ??
    []
  ).map((point: unknown) => toPoint(point));

  const nets: Net[] = (raw.nets ?? []).map((net: any) => ({
    ...net,
    id: net.id ?? generateId(),
    name: String(net.name ?? ''),
    pins: Array.isArray(net.pins) ? net.pins : [],
  }));

  return {
    ...raw,
    id: raw.id ?? generateId(),
    name: raw.name ?? 'Imported PCB',
    footprints,
    tracks,
    vias,
    zones,
    copperZones: zones,
    boardOutline: {
      polygon: boardPoints,
      points: boardPoints,
      vertices: boardPoints,
    },
    nets,
  };
}
