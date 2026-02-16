import { Vector2D } from '../math/vector2d';
import { Identifiable, Named, Positioned, UUID } from './base';
import { Net } from './net';

// ─── Layers ────────────────────────────────────────────────

export enum Layer {
  FCu = 'F.Cu',
  BCu = 'B.Cu',
  In1Cu = 'In1.Cu',
  In2Cu = 'In2.Cu',
  In3Cu = 'In3.Cu',
  In4Cu = 'In4.Cu',
  In5Cu = 'In5.Cu',
  In6Cu = 'In6.Cu',
  In7Cu = 'In7.Cu',
  In8Cu = 'In8.Cu',
  In9Cu = 'In9.Cu',
  In10Cu = 'In10.Cu',
  In11Cu = 'In11.Cu',
  In12Cu = 'In12.Cu',
  In13Cu = 'In13.Cu',
  In14Cu = 'In14.Cu',
  In15Cu = 'In15.Cu',
  In16Cu = 'In16.Cu',
  In17Cu = 'In17.Cu',
  In18Cu = 'In18.Cu',
  In19Cu = 'In19.Cu',
  In20Cu = 'In20.Cu',
  In21Cu = 'In21.Cu',
  In22Cu = 'In22.Cu',
  In23Cu = 'In23.Cu',
  In24Cu = 'In24.Cu',
  In25Cu = 'In25.Cu',
  In26Cu = 'In26.Cu',
  In27Cu = 'In27.Cu',
  In28Cu = 'In28.Cu',
  In29Cu = 'In29.Cu',
  In30Cu = 'In30.Cu',
  FSilk = 'F.SilkS',
  BSilk = 'B.SilkS',
  FMask = 'F.Mask',
  BMask = 'B.Mask',
  FPaste = 'F.Paste',
  BPaste = 'B.Paste',
  FCourtyard = 'F.CrtYd',
  BCourtyard = 'B.CrtYd',
  FFab = 'F.Fab',
  BFab = 'B.Fab',
  EdgeCuts = 'Edge.Cuts',
}

// ─── Pads ──────────────────────────────────────────────────

export enum PadShape {
  Circle = 'circle',
  Rect = 'rect',
  Oval = 'oval',
  RoundRect = 'roundrect',
  Custom = 'custom',
}

export enum PadType {
  SMD = 'smd',
  ThroughHole = 'through_hole',
  NPTH = 'npth',
}

export interface Pad extends Identifiable {
  /** Pad designator, e.g. "1", "A1". */
  number: string;
  type: PadType;
  shape: PadShape;
  /** Position relative to the footprint origin. */
  position: Vector2D;
  /** Pad size (x = width, y = height). */
  size: Vector2D;
  /** Rotation in degrees. */
  rotation: number;
  /** Drill diameter (nm) — only for TH / NPTH. */
  drill?: number;
  /** Layers this pad sits on. */
  layers: Layer[];
  /** Optional primary layer alias used by some importers. */
  layer?: Layer;
  /** Net assignment. */
  netId?: UUID;
  /** Optional net alias used by some importers. */
  net?: string;
  /** Round-rect corner ratio (0..1). */
  roundRectRatio?: number;
  /** Optional width alias (same as size.x). */
  width?: number;
  /** Optional height alias (same as size.y). */
  height?: number;
}

// ─── Footprint graphics ────────────────────────────────────

export interface FootprintLine {
  start: Vector2D;
  end: Vector2D;
  layer: Layer;
  strokeWidth: number;
}

export interface FootprintArc {
  center: Vector2D;
  radius: number;
  startAngle: number;
  endAngle: number;
  layer: Layer;
  strokeWidth: number;
}

export interface FootprintCircle {
  center: Vector2D;
  radius: number;
  layer: Layer;
  strokeWidth: number;
  filled: boolean;
}

export interface FootprintText {
  position: Vector2D;
  text: string;
  layer: Layer;
  fontSize: number;
  rotation: number;
  visible: boolean;
}

export interface Model3DRef {
  path: string;
  offset: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
}

// ─── Footprint ─────────────────────────────────────────────

export interface Footprint extends Identifiable, Named, Positioned {
  pads: Pad[];
  lines: FootprintLine[];
  arcs: FootprintArc[];
  circles: FootprintCircle[];
  texts: FootprintText[];
  courtyard: Vector2D[]; // outline polygon
  model3d?: Model3DRef;
  /** Back-reference to the Component definition. */
  componentId?: UUID;
  /** Optional reference designator used by imported runtime shapes. */
  reference?: string;
  /** Optional component value/designator (e.g. 10k, 100nF). */
  value?: string;
  /** Optional placed layer alias used by imported runtime shapes. */
  layer?: Layer;
  /** Optional footprint source name used by imported runtime shapes. */
  footprintName?: string;
  /** Optional simplified silkscreen primitives used by some importers. */
  silkscreen?: Array<{
    type: 'line' | 'arc' | 'circle' | 'text';
    position?: Vector2D;
    start?: Vector2D;
    end?: Vector2D;
    center?: Vector2D;
    radius?: number;
    text?: string;
    size?: number;
    layer?: Layer;
  }>;
}

// ─── Tracks / vias ─────────────────────────────────────────

export interface Track extends Identifiable {
  start: Vector2D;
  end: Vector2D;
  /** Width in nanometers. */
  width: number;
  layer: Layer;
  netId?: UUID;
}

export interface Via extends Identifiable {
  position: Vector2D;
  /** Annular ring diameter (nm). */
  diameter: number;
  /** Optional size alias used by runtime import shapes. */
  size?: number;
  /** Drill diameter (nm). */
  drill: number;
  /** Optional drill alias used by runtime import shapes. */
  drillDiameter?: number;
  /** Layer pair this via connects. */
  layers: [Layer, Layer];
  netId?: UUID;
}

// ─── Copper zone ───────────────────────────────────────────

export interface CopperZoneFillSettings {
  filled: boolean;
  /** Thermal relief spoke width (nm). */
  thermalGap: number;
  thermalBridgeWidth: number;
  /** Solid or hatched fill. */
  fillType: 'solid' | 'hatched';
  hatchWidth?: number;
  hatchGap?: number;
  /** Zone priority (higher = drawn later). */
  priority: number;
}

export interface CopperZone extends Identifiable {
  /** Outline polygon vertices. */
  polygon: Vector2D[];
  /** Optional outline alias used by some importers. */
  outline?: Vector2D[];
  /** Optional filled-polygon alias for pre-filled zone geometry. */
  filledPolygon?: Vector2D[];
  layer: Layer;
  netId?: UUID;
  /** Optional net alias used by importers. */
  net?: string;
  fillSettings: CopperZoneFillSettings;
}

// ─── Board outline ─────────────────────────────────────────

export interface BoardOutline {
  /** Closed polygon defining the board edge (on EdgeCuts layer). */
  polygon?: Vector2D[];
  /** Optional points alias used by runtime renderers. */
  points?: Vector2D[];
  /** Optional vertices alias from legacy parser outputs. */
  vertices?: Vector2D[];
}

// ─── Design rule (layer-stack aware) ───────────────────────

export interface LayerStackEntry {
  layer: Layer;
  type: 'signal' | 'power' | 'mixed';
  thickness: number; // nm
  material: string;
}

// ─── PCB document ──────────────────────────────────────────

export interface PCBDocument extends Identifiable, Named {
  footprints: Footprint[];
  tracks: Track[];
  vias: Via[];
  zones: CopperZone[];
  /** Optional alias used by runtime consumers. */
  copperZones?: CopperZone[];
  boardOutline: BoardOutline;
  layerStack?: LayerStackEntry[];
  /** Design rules are stored in a separate structure. */
  designRulesId?: UUID;
  /** Optional net list used by interactive routing and ratsnest. */
  nets?: Net[];
}
